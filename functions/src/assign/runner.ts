// File : /TeamSamsara.Workflow/functions/src/assign/runner.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Hands out a group's waiting tasks on the server (the rule itself
// is the engine's, engine/src/assign.ts). One run per group at a time: a run
// asked for while one is going makes that one go round again. Each task is
// given only if it's still waiting when written, so a claim at the same
// moment wins. Also finds waiting tasks due soon whose leads haven't heard.

import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type Firestore,
} from "firebase-admin/firestore";
import {
  AssignLimits,
  handOut,
  needsHeadsUp,
  readAssign,
  type AssignSettings,
  type BusyTime,
  type Candidate,
  type HandedOut,
  type HeldTask,
  type QueuedTask,
  type UsualWeek,
} from "../../../engine/src/index.js";

/** A run left this long is taken to have died. */
const lockSeconds = 120;
/** Most rounds one run goes, when more keeps arriving. */
const maxRounds = 5;
const hour = 3_600_000;

const toDate = (value: unknown): Date | null =>
  value instanceof Timestamp ? value.toDate() : null;
const chunks = <T>(items: readonly T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );

export function readWeek(data: DocumentData | undefined): UsualWeek | null {
  if (!data) return null;
  const weekly: Record<number, number[]> = {};
  const stored = (data.weekly ?? {}) as Record<string, unknown>;
  for (const [day, hours] of Object.entries(stored)) {
    const index = Number(day);
    if (Number.isInteger(index) && index >= 0 && index <= 6)
      weekly[index] = Array.isArray(hours)
        ? hours.filter((entry): entry is number => Number.isInteger(entry))
        : [];
  }
  const exceptions = Array.isArray(data.exceptions)
    ? (data.exceptions as DocumentData[])
        .filter((entry) => entry && typeof entry.date === "string")
        .map((entry) => ({
          date: String(entry.date),
          from: typeof entry.from === "string" ? entry.from : null,
          to: typeof entry.to === "string" ? entry.to : null,
          available: entry.available === true,
        }))
    : [];
  return {
    weekly,
    exceptions,
    timeZone: typeof data.timeZone === "string" ? data.timeZone : null,
  };
}

const queuedOf = (id: string, data: DocumentData): QueuedTask => ({
  id,
  eventId: typeof data.eventId === "string" ? data.eventId : null,
  dueAt: toDate(data.dueAt),
});

/** A group's waiting tasks: given to the group, to nobody in it, not done. */
async function readQueue(db: Firestore, groupId: string) {
  const snapshot = await db
    .collection("tasks")
    .where("workGroupId", "==", groupId)
    .where("memberId", "==", null)
    .where("doneAt", "==", null)
    .get();
  return snapshot.docs.map((doc) => ({
    task: queuedOf(doc.id, doc.data()),
    headsUpAt: toDate(doc.data().headsUpAt),
    title: typeof doc.data().title === "string" ? doc.data().title : "A task",
  }));
}

/** The group's active members, with their week, appointments and open tasks. */
async function readCandidates(
  db: Firestore,
  groupId: string,
  now: Date,
): Promise<Candidate[]> {
  const members = (
    await db
      .collection("members")
      .where("workGroupIds", "array-contains", groupId)
      .get()
  ).docs.filter((doc) => doc.data().status === "active");
  if (members.length === 0) return [];
  const ids = members.map((doc) => doc.id);

  const [weeks, busy, held] = await Promise.all([
    db.getAll(...ids.map((id) => db.doc(`availability/${id}`))),
    db
      .collection("busy")
      .where("startsAt", ">=", new Date(now.getTime() - 2 * 24 * hour))
      .where(
        "startsAt",
        "<",
        new Date(now.getTime() + (AssignLimits.reachDays + 1) * 24 * hour),
      )
      .get(),
    Promise.all(
      chunks(ids, 30).map((part) =>
        db
          .collection("tasks")
          .where("memberId", "in", part)
          .where("doneAt", "==", null)
          .get(),
      ),
    ),
  ]);

  const busyOf = new Map<string, BusyTime[]>();
  for (const doc of busy.docs) {
    const data = doc.data();
    const startsAt = toDate(data.startsAt);
    const endsAt = toDate(data.endsAt);
    if (!startsAt || !endsAt || typeof data.memberId !== "string") continue;
    busyOf.set(data.memberId, [
      ...(busyOf.get(data.memberId) ?? []),
      { startsAt, endsAt },
    ]);
  }
  const tasksOf = new Map<string, HeldTask[]>();
  for (const doc of held.flatMap((snapshot) => snapshot.docs)) {
    const memberId = doc.data().memberId as string;
    tasksOf.set(memberId, [
      ...(tasksOf.get(memberId) ?? []),
      queuedOf(doc.id, doc.data()),
    ]);
  }
  return ids.map((id, index) => ({
    id,
    week: readWeek(weeks[index].data()),
    busy: busyOf.get(id) ?? [],
    tasks: tasksOf.get(id) ?? [],
  }));
}

/** Takes the group's run, or marks the one going to go round again. */
async function takeRun(db: Firestore, groupId: string): Promise<boolean> {
  const ref = db.doc(`assignRuns/${groupId}`);
  return db.runTransaction(async (transaction) => {
    const since = toDate((await transaction.get(ref)).data()?.since);
    if (since && Date.now() - since.getTime() < lockSeconds * 1000) {
      transaction.set(ref, { again: true }, { merge: true });
      return false;
    }
    transaction.set(ref, { since: FieldValue.serverTimestamp(), again: false });
    return true;
  });
}

/** Whether to go round again; when not, lets the run go. */
async function goAgain(db: Firestore, groupId: string): Promise<boolean> {
  const ref = db.doc(`assignRuns/${groupId}`);
  return db.runTransaction(async (transaction) => {
    const again = (await transaction.get(ref)).data()?.again === true;
    if (again)
      transaction.set(
        ref,
        { since: FieldValue.serverTimestamp(), again: false },
        { merge: true },
      );
    else transaction.delete(ref);
    return again;
  });
}

/** Gives each task to its person, if it's still waiting; returns those given. */
async function give(
  db: Firestore,
  groupId: string,
  handed: readonly HandedOut[],
): Promise<HandedOut[]> {
  const given: HandedOut[] = [];
  for (const part of chunks(handed, 100)) {
    const refs = part.map((entry) => db.doc(`tasks/${entry.taskId}`));
    const written = await db.runTransaction(async (transaction) => {
      const docs = await transaction.getAll(...refs);
      const still: HandedOut[] = [];
      docs.forEach((doc, index) => {
        const data = doc.data();
        if (
          !data ||
          data.workGroupId !== groupId ||
          data.memberId ||
          data.doneAt
        )
          return;
        transaction.update(doc.ref, {
          memberId: part[index].memberId,
          handedOutAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        still.push(part[index]);
      });
      return still;
    });
    given.push(...written);
  }
  return given;
}

export interface GroupRun {
  given: HandedOut[];
  /** Waiting tasks due soon whose leads should hear, with their titles. */
  headsUp: { taskId: string; title: string; eventId: string | null }[];
  settings: AssignSettings;
}

/** One round: reads the group, hands out what fits, and finds heads-ups due. */
async function runOnce(
  db: Firestore,
  groupId: string,
  now: Date,
  timeZone: string,
): Promise<GroupRun | null> {
  const group = (await db.doc(`workGroups/${groupId}`).get()).data();
  const settings = readAssign(group?.assign);
  if (!group || !settings.on) return null;
  const queue = await readQueue(db, groupId);
  if (queue.length === 0) return { given: [], headsUp: [], settings };
  const candidates = await readCandidates(db, groupId, now);
  const handed = handOut(
    queue.map((entry) => entry.task),
    candidates,
    { settings, now, timeZone },
  );
  const given = await give(db, groupId, handed);
  const givenIds = new Set(given.map((entry) => entry.taskId));
  const headsUp = queue
    .filter(
      (entry) =>
        !givenIds.has(entry.task.id) &&
        !entry.headsUpAt &&
        needsHeadsUp(entry.task, settings, now),
    )
    .map((entry) => ({
      taskId: entry.task.id,
      title: entry.title,
      eventId: entry.task.eventId,
    }));
  if (headsUp.length) {
    const writer = db.bulkWriter();
    for (const entry of headsUp)
      writer.update(db.doc(`tasks/${entry.taskId}`), {
        headsUpAt: FieldValue.serverTimestamp(),
      });
    await writer.close();
  }
  return { given, headsUp, settings };
}

/**
 * Runs a group's hand-out, unless one is already going (that one goes round
 * again instead). Returns everything given and every heads-up found, for the
 * caller to tell people about; null when another run has it.
 */
export async function runGroup(
  db: Firestore,
  groupId: string,
  timeZone: string,
): Promise<GroupRun | null> {
  if (!(await takeRun(db, groupId))) return null;
  const total: GroupRun = {
    given: [],
    headsUp: [],
    settings: readAssign(undefined),
  };
  let released = false;
  try {
    let round = 0;
    for (;;) {
      const result = await runOnce(db, groupId, new Date(), timeZone);
      if (!result) break;
      total.given.push(...result.given);
      total.headsUp.push(...result.headsUp);
      total.settings = result.settings;
      round += 1;
      if (round >= maxRounds) break;
      if (!(await goAgain(db, groupId))) {
        released = true;
        break;
      }
    }
  } finally {
    // Let the run go when it ended any other way (off, an error, enough rounds).
    if (!released) await db.doc(`assignRuns/${groupId}`).delete();
  }
  return total;
}

/** Whether a task's change can change what its group can hand out. */
export function touchesQueue(
  before: DocumentData | undefined,
  after: DocumentData | undefined,
): string[] {
  const queued = (data: DocumentData | undefined) =>
    Boolean(data && data.workGroupId && !data.memberId && !data.doneAt);
  const groups = new Set<string>();
  const groupOf = (data: DocumentData | undefined) =>
    typeof data?.workGroupId === "string" ? data.workGroupId : null;
  // A task now waiting, or waiting with a new due time.
  if (
    queued(after) &&
    (!queued(before) ||
      groupOf(before) !== groupOf(after) ||
      toDate(before?.dueAt)?.getTime() !== toDate(after?.dueAt)?.getTime())
  )
    groups.add(groupOf(after) as string);
  // Someone's task done, taken back or gone: they may have room again.
  const freed =
    Boolean(before?.memberId) &&
    !before?.doneAt &&
    (!after || after.doneAt || after.memberId !== before?.memberId);
  if (freed && groupOf(before)) groups.add(groupOf(before) as string);
  return [...groups];
}

/** The groups that hand out their tasks. */
export async function groupsHandingOut(db: Firestore): Promise<string[]> {
  const snapshot = await db
    .collection("workGroups")
    .where("assign.on", "==", true)
    .get();
  return snapshot.docs.map((doc) => doc.id);
}

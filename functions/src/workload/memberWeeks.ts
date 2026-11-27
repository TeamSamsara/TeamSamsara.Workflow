// File : /TeamSamsara.Workflow/functions/src/workload/memberWeeks.ts
// Version : 1.1.0
// Latest commit: feature/1.2-workload-c
// Author : Gerrah
// Purpose : Each person's weeks, kept by the server in memberWeeks/{id} as
// one word per week (Available, Limited, At capacity, Over capacity). People
// can't read each other's tasks, but Reassign, claiming and a group's page
// need to know who has room; the word is all they see, never the tasks or the
// numbers. Worked out again when someone's tasks, their usual week, or the
// workspace's week change.

import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type Firestore,
} from "firebase-admin/firestore";
import {
  dayKey,
  readUsualWeek,
  sizeWeight,
  taskSize,
  weekOf,
  weekState,
  WorkloadLimits,
  type TaskSize,
  type WeekState,
} from "../../../engine/src/index.js";
import { readWorkspaceWeek, type WorkspaceWeek } from "../assign/runner.js";

export interface WeekTaskRow {
  dueAt: Date | null;
  size: TaskSize;
}

export interface MemberWeeks {
  /** By the first day of each week ("2026-11-16") that has dated tasks. */
  states: Record<string, WeekState>;
  /** A week with none of their dated tasks. */
  empty: WeekState;
}

/**
 * Someone's weeks from their open tasks. A task with no due time counts in
 * every week, as the hand-out counts it.
 */
export function memberWeeks(
  tasks: readonly WeekTaskRow[],
  usualWeek: number,
  timeZone: string,
  weekStartsOn: WorkspaceWeek["weekStartsOn"],
): MemberWeeks {
  const base = tasks
    .filter((task) => !task.dueAt)
    .reduce((sum, task) => sum + sizeWeight(task.size), 0);
  const loads = new Map<string, number>();
  for (const task of tasks) {
    if (!task.dueAt) continue;
    const key = dayKey(
      weekOf(task.dueAt, timeZone, weekStartsOn).start,
      timeZone,
    );
    loads.set(key, (loads.get(key) ?? base) + sizeWeight(task.size));
  }
  return {
    states: Object.fromEntries(
      [...loads].map(([key, load]) => [key, weekState(usualWeek, load)]),
    ),
    empty: weekState(usualWeek, base),
  };
}

const toDate = (value: unknown): Date | null =>
  value instanceof Timestamp ? value.toDate() : null;

/** A task's row for someone's weeks. */
export function weekTaskRow(data: DocumentData): WeekTaskRow {
  return {
    dueAt: toDate(data.dueAt),
    size: taskSize({
      checklist: Array.isArray(data.checklist) ? data.checklist : null,
      posts: Array.isArray(data.posts) ? data.posts : null,
      needsApproval: data.needsApproval === true,
    }),
  };
}

/** Whether a task change can change anyone's weeks. */
export function touchesWeeks(
  before: DocumentData | undefined,
  after: DocumentData | undefined,
): string[] {
  const ids = new Set<string>();
  const changed =
    !before ||
    !after ||
    before.memberId !== after.memberId ||
    toDate(before.dueAt)?.getTime() !== toDate(after.dueAt)?.getTime() ||
    (toDate(before.doneAt) === null) !== (toDate(after.doneAt) === null) ||
    weekTaskRow(before).size !== weekTaskRow(after).size;
  if (!changed) return [];
  for (const data of [before, after])
    if (typeof data?.memberId === "string") ids.add(data.memberId);
  return [...ids];
}

/**
 * Whether someone has room for a task in the week it's due, counting their
 * other open tasks (a task with no due time counts in every week).
 */
export function roomForTask(
  others: readonly WeekTaskRow[],
  task: WeekTaskRow,
  usualWeek: number,
  timeZone: string,
  weekStartsOn: WorkspaceWeek["weekStartsOn"],
  now: Date,
): boolean {
  const week = weekOf(task.dueAt ?? now, timeZone, weekStartsOn);
  const load = others.reduce((sum, other) => {
    const due = other.dueAt?.getTime() ?? null;
    return due === null ||
      (due >= week.start.getTime() && due < week.end.getTime())
      ? sum + sizeWeight(other.size)
      : sum;
  }, 0);
  return usualWeek - load >= sizeWeight(task.size);
}

/** Someone's usual week and other open tasks, for roomForTask. */
export async function readRoom(
  db: Firestore,
  memberId: string,
  exceptTaskId: string,
): Promise<{
  usualWeek: number;
  others: WeekTaskRow[];
  week: WorkspaceWeek;
  timeZone: string;
}> {
  const [week, workspace, member, open] = await Promise.all([
    readWorkspaceWeek(db),
    db.doc("config/workspace").get(),
    db.doc(`members/${memberId}`).get(),
    db
      .collection("tasks")
      .where("memberId", "==", memberId)
      .where("doneAt", "==", null)
      .get(),
  ]);
  return {
    usualWeek: readUsualWeek(member.data()?.usualWeek) ?? week.usualWeek,
    others: open.docs
      .filter((doc) => doc.id !== exceptTaskId)
      .map((doc) => weekTaskRow(doc.data())),
    week,
    timeZone: String(workspace.data()?.timeZone ?? "UTC"),
  };
}

/** A group's weeks: how much of each week its open tasks take, and its usual week. */
export interface GroupWeeks {
  /** By the first day of each week that has dated tasks. */
  loads: Record<string, number>;
  /** What a week with no dated tasks takes (tasks with no due time). */
  base: number;
  usualWeek: number | null;
}

/** A group's weeks from its open tasks (given to it, to anyone in it or no one). */
export function groupWeeks(
  tasks: readonly WeekTaskRow[],
  usualWeek: number | null,
  timeZone: string,
  weekStartsOn: WorkspaceWeek["weekStartsOn"],
): GroupWeeks {
  const base = tasks
    .filter((task) => !task.dueAt)
    .reduce((sum, task) => sum + sizeWeight(task.size), 0);
  const loads: Record<string, number> = {};
  for (const task of tasks) {
    if (!task.dueAt) continue;
    const key = dayKey(
      weekOf(task.dueAt, timeZone, weekStartsOn).start,
      timeZone,
    );
    loads[key] = (loads[key] ?? base) + sizeWeight(task.size);
  }
  return { loads, base, usualWeek };
}

/** The groups whose weeks a task change touches. */
export function groupsTouched(
  before: DocumentData | undefined,
  after: DocumentData | undefined,
): string[] {
  const ids = new Set<string>();
  const changed =
    !before ||
    !after ||
    before.workGroupId !== after.workGroupId ||
    toDate(before.dueAt)?.getTime() !== toDate(after.dueAt)?.getTime() ||
    (toDate(before.doneAt) === null) !== (toDate(after.doneAt) === null) ||
    weekTaskRow(before).size !== weekTaskRow(after).size;
  if (!changed) return [];
  for (const data of [before, after])
    if (typeof data?.workGroupId === "string") ids.add(data.workGroupId);
  return [...ids];
}

/** Works out and saves these groups' weeks. */
export async function saveGroupWeeks(
  db: Firestore,
  groupIds: readonly string[],
): Promise<void> {
  if (groupIds.length === 0) return;
  const week = await readWorkspaceWeek(db);
  const zone = String(
    (await db.doc("config/workspace").get()).data()?.timeZone ?? "UTC",
  );
  for (const groupId of groupIds) {
    const [group, open] = await Promise.all([
      db.doc(`workGroups/${groupId}`).get(),
      db
        .collection("tasks")
        .where("workGroupId", "==", groupId)
        .where("doneAt", "==", null)
        .get(),
    ]);
    if (!group.exists) {
      await db.doc(`groupWeeks/${groupId}`).delete();
      continue;
    }
    await db.doc(`groupWeeks/${groupId}`).set({
      ...groupWeeks(
        open.docs.map((doc) => weekTaskRow(doc.data())),
        readUsualWeek(group.data()?.usualWeek, WorkloadLimits.group),
        zone,
        week.weekStartsOn,
      ),
      weekStartsOn: week.weekStartsOn,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

/** Whether a week in this state has room for a task of this size. */
export function fitsState(state: WeekState, size: TaskSize): boolean {
  return size === "bigger"
    ? state === "available"
    : state === "available" || state === "limited";
}

/** A task meant for someone who now has room for it. */
export interface RoomAgain {
  memberId: string;
  taskId: string;
  title: string;
  groupId: string | null;
  eventId: string | null;
}

/**
 * Works out and saves these people's weeks. Gives back the tasks meant for
 * them that they had no room for before and have room for now.
 */
export async function saveMemberWeeks(
  db: Firestore,
  memberIds: readonly string[],
  workspace?: WorkspaceWeek,
  timeZone?: string,
): Promise<RoomAgain[]> {
  const roomAgain: RoomAgain[] = [];
  if (memberIds.length === 0) return roomAgain;
  const week = workspace ?? (await readWorkspaceWeek(db));
  const zone =
    timeZone ??
    String((await db.doc("config/workspace").get()).data()?.timeZone ?? "UTC");
  for (const memberId of memberIds) {
    const [member, open, saved, meant] = await Promise.all([
      db.doc(`members/${memberId}`).get(),
      db
        .collection("tasks")
        .where("memberId", "==", memberId)
        .where("doneAt", "==", null)
        .get(),
      db.doc(`memberWeeks/${memberId}`).get(),
      db
        .collection("tasks")
        .where("meantFor", "==", memberId)
        .where("memberId", "==", null)
        .where("doneAt", "==", null)
        .get(),
    ]);
    const usual = readUsualWeek(member.data()?.usualWeek) ?? week.usualWeek;
    const weeks = memberWeeks(
      open.docs.map((doc) => weekTaskRow(doc.data())),
      usual,
      zone,
      week.weekStartsOn,
    );
    const before = saved.data() as Partial<MemberWeeks> | undefined;
    const stateIn = (all: Partial<MemberWeeks> | undefined, at: Date) =>
      all?.states?.[dayKey(weekOf(at, zone, week.weekStartsOn).start, zone)] ??
      all?.empty ??
      "atCapacity";
    for (const doc of meant.docs) {
      const row = weekTaskRow(doc.data());
      const at = row.dueAt ?? new Date();
      if (
        !fitsState(stateIn(before, at), row.size) &&
        fitsState(stateIn(weeks, at), row.size)
      )
        roomAgain.push({
          memberId,
          taskId: doc.id,
          title: String(doc.data().title ?? "A task"),
          groupId:
            typeof doc.data().workGroupId === "string"
              ? doc.data().workGroupId
              : null,
          eventId:
            typeof doc.data().eventId === "string" ? doc.data().eventId : null,
        });
    }
    await db.doc(`memberWeeks/${memberId}`).set({
      ...weeks,
      weekStartsOn: week.weekStartsOn,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  return roomAgain;
}

// File : /TeamSamsara.Workflow/functions/src/index.ts
// Version : 1.7.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Playbook's server functions. They watch tasks and events and
// write notifications for the people a change concerns (never the person who
// made it), send reminders before tasks are due and events start, email the
// kinds each person asked for (through Resend), ask people to reply to events
// and tell planners about the replies, send invites, password links and a test
// email (all in Playbook's own email design), and sign someone out on every
// device. A weekly check-up (src/maintenance) tidies data that points at
// deleted things. Work done in bulk (a set or repeat planned, a workflow's changes
// passed on to its tasks) sends one summary per person instead of one each.

import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  FieldValue,
  getFirestore,
  Timestamp,
  type DocumentData,
} from "firebase-admin/firestore";
import { logger, setGlobalOptions } from "firebase-functions/v2";
import {
  onDocumentCreated,
  onDocumentWrittenWithAuthContext,
} from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  readRoles,
  requireActor,
  requireAllowed,
} from "./access/readAccess.js";
import { reviewersFor } from "./access/reviewers.js";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret, defineString } from "firebase-functions/params";
import {
  eventAudience,
  eventNotifications,
  isDueIn,
  readSettings,
  reminderAt,
  replyNotifications,
  SettingGroupOf,
  taskNotifications,
  waitingOn,
  type Audience,
  type EventData,
  type ReplyAnswer,
  type NotificationKind,
  type TaskData,
} from "./model.js";
import {
  inviteEmail,
  notificationEmail,
  resetEmail,
  testEmail,
  type Email,
  type Sender,
} from "./emails/templates.js";
import {
  firstStart,
  setSummaries,
  syncSummaries,
  type MemberSummary,
  type SummaryEvent,
  type SummaryTask,
} from "./summaries.js";
import { when, type Formats } from "./text.js";
import { readWorkflow } from "./engineData.js";
import {
  changedStepTitles,
  stepsChanged,
  syncWorkflow,
} from "./workflowSync.js";

initializeApp();
setGlobalOptions({ maxInstances: 5 });

const db = getFirestore();
const resendKey = defineSecret("RESEND_API_KEY");
// Asked once at the first deploy; the defaults only suit the local emulators.
const mailFrom = defineString("MAIL_FROM", {
  description:
    'Who notification emails come from, like "Playbook <notifications@yourdomain>" (a domain verified in Resend)',
  default: "Playbook <notifications@example.test>",
});
const appUrl = defineString("APP_URL", {
  description:
    "Playbook's web address, for links in emails, like https://playbook.yourdomain",
  default: "http://localhost:5173",
});
/** The local emulators never send real email, whatever key they can see. */
const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";

// #region Reading what's needed

interface Member {
  id: string;
  name: string;
  email: string | null;
  status: "active";
  roleIds: string[];
  workGroupIds: string[];
  /** Kept by the server (functions/src/access/keepAccess.ts). */
  rank: number;
  leadOf: string[];
}

const toDate = (value: unknown): Date | null =>
  value instanceof Timestamp ? value.toDate() : null;
const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;
const list = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry) => typeof entry === "string")
    : [];

/** Active members, with how others see their name. */
async function activeMembers(): Promise<Member[]> {
  const snapshot = await db
    .collection("members")
    .where("status", "==", "active")
    .get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name:
        text(data.gameName) ??
        text(data.displayName) ??
        text(data.email) ??
        "Someone",
      email: text(data.email),
      status: "active" as const,
      roleIds: list(data.roleIds),
      workGroupIds: list(data.workGroupIds),
      rank: typeof data.rank === "number" ? data.rank : 0,
      leadOf: list(data.leadOf),
    };
  });
}

async function workspaceFormats(): Promise<Formats> {
  const data = (await db.doc("config/workspace").get()).data() ?? {};
  return {
    timeZone: text(data.timeZone) ?? "America/Toronto",
    clock: data.timeFormat === "24h" ? "24h" : "12h",
  };
}

/** Who to ask to approve a task: its group's leads first (see access/reviewers). */
async function reviewerIds(
  task: TaskData,
  members: readonly Member[],
): Promise<string[]> {
  const roles = readRoles((await db.doc("config/roles").get()).data());
  return reviewersFor(task, members, roles);
}

function taskData(data: DocumentData | undefined): TaskData | null {
  if (!data) return null;
  return {
    title: text(data.title) ?? "A task",
    memberId: text(data.memberId),
    workGroupId: text(data.workGroupId),
    eventId: text(data.eventId),
    sentForReviewBy: text(data.sentForReviewBy),
    sentForReviewAt: toDate(data.sentForReviewAt),
    approvedAt: toDate(data.approvedAt),
    changesRequested: text(data.changesRequested),
    dueAt: toDate(data.dueAt),
    doneAt: toDate(data.doneAt),
  };
}

function eventData(data: DocumentData | undefined): EventData | null {
  if (!data) return null;
  return {
    title: text(data.title) ?? "An event",
    startsAt: toDate(data.startsAt) ?? new Date(0),
    everyone: data.everyone === true,
    groupIds: list(data.groupIds),
    memberIds: list(data.memberIds),
    repeatId: text(data.repeatId),
    setId: text(data.setId),
    createdBy: text(data.createdBy),
    asksReply: data.asksReply === true,
    requiredIds: list(data.requiredIds),
    tellEveryReply: data.tellEveryReply === true,
    replies: replies(data.replies),
  };
}

const answers: readonly string[] = ["going", "maybe", "cant"];

function replies(value: unknown): EventData["replies"] {
  const result: EventData["replies"] = {};
  if (!value || typeof value !== "object") return result;
  for (const [id, entry] of Object.entries(value as Record<string, unknown>)) {
    const reply = (entry ?? {}) as Record<string, unknown>;
    if (typeof reply.answer === "string" && answers.includes(reply.answer))
      result[id] = {
        answer: reply.answer as ReplyAnswer,
        note: typeof reply.note === "string" ? reply.note : "",
      };
  }
  return result;
}

// #endregion

// #region Delivering

interface Note {
  kind: NotificationKind;
  actorId: string | null;
  title: string;
  detail: string | null;
  taskId: string | null;
  eventId: string | null;
  groupId: string | null;
  /** Someone's reply to an event, for "replied". */
  answer?: string | null;
  /** Where it opens, for summaries ("/my-tasks", a set's page). */
  path?: string | null;
}

/** A summary's counts as the notification keeps them. */
function summaryData(summary: MemberSummary, eventCount: number) {
  return {
    eventCount,
    mine: summary.mine,
    groups: summary.groups,
    inEvents: summary.inEvents,
    lines: summary.lines.map((line) => ({
      title: line.title,
      events: line.events,
      firstDue: line.firstDue ? Timestamp.fromDate(line.firstDue) : null,
    })),
  };
}

/** Who the emails say they're from, and where their links and logo point. */
async function sender(): Promise<Sender> {
  const data = (await db.doc("config/workspace").get()).data() ?? {};
  return {
    workspace: text(data.name) ?? "Your team",
    appUrl: appUrl.value().replace(/\/+$/, ""),
  };
}

async function sendEmail(to: string, email: Email) {
  const { subject, html, text: plain } = email;
  const key = isEmulator ? "" : resendKey.value();
  if (!key) {
    logger.info("Email not sent (emulator or no key)", { to, subject });
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: mailFrom.value(),
      to: [to],
      subject,
      html,
      text: plain,
    }),
  });
  if (!response.ok)
    throw new Error(`Resend said ${response.status}: ${await response.text()}`);
}

function linkFor(note: Note): string {
  const base = appUrl.value().replace(/\/+$/, "");
  // A cancelled event has no page left to open.
  if (note.kind === "eventCancelled") return base;
  if (note.path) return `${base}${note.path}`;
  if (note.taskId) return `${base}/tasks/${encodeURIComponent(note.taskId)}`;
  if (note.eventId) return `${base}/events/${encodeURIComponent(note.eventId)}`;
  return base;
}

/** Writes the notification and sends the email, as each member's settings say. */
async function deliver(
  memberIds: Iterable<string>,
  note: Note,
  members: readonly Member[],
  groupNames: ReadonlyMap<string, string> = new Map(),
  /** What only this person's copy says (a summary's counts). */
  extra: (memberId: string) => Record<string, unknown> = () => ({}),
): Promise<void> {
  const ids = [...new Set(memberIds)].filter((id) => id !== note.actorId);
  if (ids.length === 0) return;
  const settings = await Promise.all(
    ids.map((id) => db.doc(`notificationSettings/${id}`).get()),
  );
  const group = SettingGroupOf[note.kind];
  const actor =
    members.find((member) => member.id === note.actorId)?.name ?? null;
  let from: Sender | null = null;
  await Promise.all(
    ids.map(async (id, index) => {
      const choice = readSettings(settings[index].data());
      const member = members.find((entry) => entry.id === id);
      if (!member) return;
      if (choice.app[group]) {
        await db.collection("notifications").add({
          memberId: id,
          ...note,
          ...extra(id),
          createdAt: FieldValue.serverTimestamp(),
          readAt: null,
        });
      }
      if (choice.email[group] && member.email) {
        const email = notificationEmail(from ?? (from = await sender()), {
          kind: note.kind,
          said: {
            actor,
            title: note.title,
            detail: note.detail,
            group: note.groupId ? (groupNames.get(note.groupId) ?? null) : null,
            answer: note.answer ?? null,
          },
          link: linkFor(note),
        });
        await sendEmail(member.email, email).catch((error: unknown) =>
          logger.error("Email not sent", { id, error: String(error) }),
        );
      }
    }),
  );
}

async function groupNames(): Promise<Map<string, string>> {
  const snapshot = await db.collection("workGroups").get();
  return new Map(
    snapshot.docs.map((doc) => [doc.id, text(doc.data().name) ?? doc.id]),
  );
}

function resolve(
  to: Audience,
  members: readonly Member[],
  approvers: () => Promise<string[]>,
): Promise<string[]> | string[] {
  if ("member" in to) return [to.member];
  if ("group" in to)
    return members
      .filter((member) => member.workGroupIds.includes(to.group))
      .map((m) => m.id);
  return approvers();
}

// #endregion

// #region Watching tasks and events

export const onTaskWritten = onDocumentWrittenWithAuthContext(
  { document: "tasks/{taskId}", secrets: [resendKey] },
  async (event) => {
    const before = taskData(event.data?.before.data());
    const after = taskData(event.data?.after.data());
    // Changes the platform makes itself (keeping tasks in line with their
    // workflow, updates, clean-ups) send their own summary, if any.
    if (event.authType === "service_account" || !event.authId) return;
    const planned = taskNotifications(before, after);
    if (planned.length === 0 || !after) return;

    // Tasks a repeat or a set makes in bulk don't each announce themselves.
    if (!before && after.eventId) {
      const parent = eventData(
        (await db.doc(`events/${after.eventId}`).get()).data(),
      );
      if (parent?.repeatId || parent?.setId) return;
    }

    const members = await activeMembers();
    const names = await groupNames();
    for (const plan of planned) {
      const ids = await resolve(plan.to, members, () =>
        reviewerIds(after, members),
      );
      await deliver(
        ids,
        {
          kind: plan.kind,
          actorId: event.authId ?? null,
          title: after.title,
          detail: plan.detail ?? null,
          taskId: event.params.taskId,
          eventId: after.eventId,
          groupId: "group" in plan.to ? plan.to.group : null,
        },
        members,
        names,
      );
    }
  },
);

/** Whether a deleted event went because its whole repeat, or its end, went. */
async function seriesTakesIt(event: EventData): Promise<boolean> {
  const repeat = (await db.doc(`repeats/${event.repeatId}`).get()).data();
  if (!repeat) return true;
  const endDate = text(repeat.endDate);
  if (repeat.endKind !== "onDate" || !endDate) return false;
  const { timeZone } = await workspaceFormats();
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(event.startsAt);
  return day > endDate;
}

export const onEventWritten = onDocumentWrittenWithAuthContext(
  { document: "events/{eventId}", secrets: [resendKey] },
  async (event) => {
    const before = eventData(event.data?.before.data());
    const after = eventData(event.data?.after.data());
    const members = await activeMembers();
    let plans = eventNotifications(before, after, members, new Date());
    // A repeat deleted or ended from this date on takes its events in bulk;
    // nobody gets one "cancelled" per date.
    if (before && !after && before.repeatId && (await seriesTakesIt(before)))
      plans = plans.filter((plan) => plan.kind !== "eventCancelled");
    const replyPlans = replyNotifications(before, after);
    if (plans.length === 0 && replyPlans.length === 0) return;
    const formats = await workspaceFormats();
    const shown = (after ?? before)!;
    // Replies tell whoever made the event (never themselves: deliver skips the actor).
    for (const plan of replyPlans) {
      if (!after?.createdBy) break;
      await deliver(
        [after.createdBy],
        {
          kind: plan.kind,
          actorId: plan.memberId,
          title: shown.title,
          detail: plan.note.trim() || null,
          taskId: null,
          eventId: event.params.eventId,
          groupId: null,
          answer: plan.answer,
        },
        members,
      );
    }
    for (const plan of plans) {
      await deliver(
        plan.memberIds,
        {
          kind: plan.kind,
          actorId: event.authId ?? null,
          title: shown.title,
          detail: when(shown.startsAt, formats),
          taskId: null,
          eventId: after ? event.params.eventId : null,
          groupId: null,
        },
        members,
      );
    }
  },
);

// #endregion

// #region Summaries for work done in bulk

function summaryTask(id: string, data: DocumentData): SummaryTask {
  const workflowId = text(data.workflowId);
  const stepId = text(data.stepId);
  return {
    id,
    title: text(data.title) ?? "A task",
    memberId: text(data.memberId),
    workGroupId: text(data.workGroupId),
    stepKey: workflowId && stepId ? `${workflowId}:${stepId}` : null,
    dueAt: toDate(data.dueAt),
  };
}

/** Reads documents by id, in groups the admin SDK takes at once. */
async function readAll(collection: string, ids: readonly string[]) {
  const found: { id: string; data: DocumentData }[] = [];
  for (let start = 0; start < ids.length; start += 100) {
    const refs = ids
      .slice(start, start + 100)
      .map((id) => db.collection(collection).doc(id));
    if (refs.length === 0) continue;
    const snapshots = await db.getAll(...refs);
    for (const snapshot of snapshots) {
      const data = snapshot.data();
      if (data) found.push({ id: snapshot.id, data });
    }
  }
  return found;
}

/** The tasks of these events. */
async function tasksOfEvents(eventIds: readonly string[]) {
  const found: SummaryTask[] = [];
  for (let start = 0; start < eventIds.length; start += 30) {
    const snapshot = await db
      .collection("tasks")
      .where("eventId", "in", eventIds.slice(start, start + 30))
      .get();
    for (const doc of snapshot.docs)
      found.push(summaryTask(doc.id, doc.data()));
  }
  return found;
}

/**
 * A set or repeat was planned (the app records it once every event and task
 * is saved): one notification per person it concerns.
 */
export const onBulkPlanCreated = onDocumentCreated(
  { document: "bulkPlans/{planId}", secrets: [resendKey] },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const eventIds = list(data.eventIds);
    const events: SummaryEvent[] = (await readAll("events", eventIds)).map(
      ({ id, data: entry }) => ({
        id,
        startsAt: toDate(entry.startsAt) ?? new Date(0),
        everyone: entry.everyone === true,
        groupIds: list(entry.groupIds),
        memberIds: list(entry.memberIds),
      }),
    );
    if (events.length === 0) return;
    const tasks = await tasksOfEvents(events.map((entry) => entry.id));
    const members = await activeMembers();
    const actorId = text(data.byId);
    const summaries = setSummaries(events, tasks, members, actorId);
    if (summaries.length === 0) return;
    const formats = await workspaceFormats();
    const first = firstStart(events);
    const count = events.length;
    const detail = `${count === 1 ? "1 event" : `${count} events`}${first ? `, from ${when(first, formats)}` : ""}`;
    const setId = data.kind === "set" ? text(data.sourceId) : null;
    const byMember = new Map(summaries.map((entry) => [entry.memberId, entry]));
    await deliver(
      byMember.keys(),
      {
        kind: "setPlanned",
        actorId,
        title: text(data.name) ?? "Some events",
        detail,
        taskId: null,
        eventId: null,
        groupId: null,
        path: setId ? `/events/sets/${encodeURIComponent(setId)}` : "/my-tasks",
      },
      members,
      await groupNames(),
      (id) => {
        const summary = byMember.get(id);
        return summary
          ? {
              summary: summaryData(summary, count),
              setId,
              repeatId: data.kind === "repeat" ? text(data.sourceId) : null,
            }
          : {};
      },
    );
  },
);

/** A saved workflow moved upcoming tasks: one notification per person whose tasks moved. */
export const onWorkflowSyncCreated = onDocumentCreated(
  { document: "workflowSyncs/{syncId}", secrets: [resendKey] },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const tasks = (await readAll("tasks", list(data.taskIds))).map(
      ({ id, data: entry }) => summaryTask(id, entry),
    );
    const members = await activeMembers();
    const actorId = text(data.byId);
    const summaries = syncSummaries(tasks, members, actorId);
    if (summaries.length === 0) return;
    const changes = list(data.changes);
    const byMember = new Map(summaries.map((entry) => [entry.memberId, entry]));
    await deliver(
      byMember.keys(),
      {
        kind: "tasksMoved",
        actorId,
        title: text(data.workflowName) ?? "A workflow",
        detail: changes[0] ?? null,
        taskId: null,
        eventId: null,
        groupId: null,
        path: "/my-tasks",
      },
      members,
      await groupNames(),
      (id) => {
        const summary = byMember.get(id);
        return summary ? { summary: summaryData(summary, 0) } : {};
      },
    );
  },
);

/**
 * A saved workflow: every upcoming event that uses it gets its open tasks
 * brought in line in the background (parts changed by hand stay), and a task
 * for each step added. The people whose tasks changed get one notification,
 * through a workflowSyncs record (see onWorkflowSyncCreated).
 */
export const onWorkflowSaved = onDocumentWrittenWithAuthContext(
  { document: "workflows/{workflowId}", timeoutSeconds: 300 },
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    if (!beforeData || !afterData || afterData.archived === true) return;
    const id = event.params.workflowId;
    const before = readWorkflow(id, beforeData);
    const after = readWorkflow(id, afterData);
    if (!stepsChanged(before, after)) return;
    // A member's id (never an email, which a service account would have).
    const byId =
      event.authId && !event.authId.includes("@") ? event.authId : null;
    const result = await syncWorkflow(db, { before, after, byId });
    const taskIds = [
      ...result.updated.map((entry) => entry.taskId),
      ...result.createdIds,
    ];
    logger.info("Workflow synced", {
      workflowId: id,
      events: result.events,
      updated: result.updated.length,
      created: result.createdIds.length,
      kept: result.held.length,
    });
    if (taskIds.length === 0) return;
    await db.collection("workflowSyncs").add({
      workflowId: id,
      workflowName: after.name.slice(0, 120),
      byId,
      taskIds: taskIds.slice(0, 500),
      taskCount: taskIds.length,
      changes: [changedStepTitles(before, after).join(", ").slice(0, 200)],
      at: FieldValue.serverTimestamp(),
    });
  },
);

// #endregion

// #region Reminders

const reminderReach = 40 * 60 * 60 * 1000;
const runEvery = 15 * 60 * 1000;

/** Claims a reminder so a second run doesn't send it again. */
async function claim(id: string): Promise<boolean> {
  try {
    await db
      .doc(`sentReminders/${id}`)
      .create({ at: FieldValue.serverTimestamp() });
    return true;
  } catch {
    return false;
  }
}

export const sendReminders = onSchedule(
  { schedule: "every 15 minutes", secrets: [resendKey] },
  async () => {
    const now = new Date();
    // A minute of overlap with the last run; claim() keeps it from doubling.
    const from = new Date(now.getTime() - runEvery - 60 * 1000);
    const until = Timestamp.fromDate(new Date(now.getTime() + reminderReach));
    const [members, formats] = await Promise.all([
      activeMembers(),
      workspaceFormats(),
    ]);
    const settingsOf = new Map(
      (await db.collection("notificationSettings").get()).docs.map((doc) => [
        doc.id,
        readSettings(doc.data()),
      ]),
    );
    const choiceOf = (id: string) =>
      settingsOf.get(id) ?? readSettings(undefined);
    const nowStamp = Timestamp.fromDate(now);

    const tasks = await db
      .collection("tasks")
      .where("dueAt", ">", nowStamp)
      .where("dueAt", "<=", until)
      .get();
    for (const doc of tasks.docs) {
      const task = taskData(doc.data());
      if (!task?.dueAt || task.doneAt) continue;
      const ids = task.memberId
        ? [task.memberId]
        : members
            .filter(
              (m) =>
                task.workGroupId && m.workGroupIds.includes(task.workGroupId),
            )
            .map((m) => m.id);
      for (const id of ids) {
        const at = reminderAt(
          task.dueAt,
          choiceOf(id).taskReminder,
          formats.timeZone,
        );
        if (!isDueIn(at, from, now)) continue;
        if (!(await claim(`task_${doc.id}_${id}_${task.dueAt.getTime()}`)))
          continue;
        await deliver(
          [id],
          {
            kind: "taskDue",
            actorId: null,
            title: task.title,
            detail: when(task.dueAt, formats),
            taskId: doc.id,
            eventId: task.eventId,
            groupId: null,
          },
          members,
        );
      }
    }

    const events = await db
      .collection("events")
      .where("startsAt", ">", nowStamp)
      .where("startsAt", "<=", until)
      .get();
    for (const doc of events.docs) {
      const item = eventData(doc.data());
      if (!item) continue;
      for (const id of eventAudience(item, members)) {
        const at = reminderAt(
          item.startsAt,
          choiceOf(id).eventReminder,
          formats.timeZone,
        );
        if (!isDueIn(at, from, now)) continue;
        if (!(await claim(`event_${doc.id}_${id}_${item.startsAt.getTime()}`)))
          continue;
        await deliver(
          [id],
          {
            kind: "eventSoon",
            actorId: null,
            title: item.title,
            detail: when(item.startsAt, formats),
            taskId: null,
            eventId: doc.id,
            groupId: null,
          },
          members,
        );
      }
    }
  },
);

// #endregion

// #region Called from the app

/** Sends the signed-in person a test email, to check email works. */
export const sendTestEmail = onCall(
  { secrets: [resendKey] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");
    const member = (await db.doc(`members/${uid}`).get()).data();
    const email = text(member?.email);
    if (!email || member?.status !== "active")
      throw new HttpsError(
        "failed-precondition",
        "No active member with an email.",
      );
    await sendEmail(email, testEmail(await sender(), { email })).catch(
      (error: unknown) => {
        throw new HttpsError("internal", String(error));
      },
    );
    return { sentTo: email };
  },
);

/**
 * A link to choose a password, opening Playbook's own page (not Firebase's).
 * Null when there's no account for the email.
 */
async function passwordLink(
  email: string,
  purpose: "invite" | "reset",
): Promise<string | null> {
  const base = appUrl.value().replace(/\/+$/, "");
  const next = new URL("/sign-in", base);
  if (purpose === "invite") next.searchParams.set("invite", "1");
  let made: string;
  try {
    made = await getAuth().generatePasswordResetLink(email, {
      url: next.toString(),
    });
  } catch (error) {
    if ((error as { code?: string }).code === "auth/user-not-found")
      return null;
    throw error;
  }
  const code = new URL(made).searchParams.get("oobCode");
  if (!code) throw new Error("Firebase gave a link without a code.");
  const link = new URL("/auth/link", base);
  link.searchParams.set("mode", "resetPassword");
  link.searchParams.set("oobCode", code);
  link.searchParams.set("continueUrl", next.toString());
  // The local emulators send nothing, so the link shows in their log instead.
  if (isEmulator) logger.info(`Password link for ${email}: ${link}`);
  return link.toString();
}

/** Whether the member's roles grant one of the permissions (Administrator counts). */

/** Emails an invited person the link to choose their password. Manage members only. */
export const sendInvite = onCall({ secrets: [resendKey] }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");
  const email = text((request.data as { email?: unknown })?.email)?.trim();
  if (!email) throw new HttpsError("invalid-argument", "Which email?");
  const actor = await requireActor(db, uid);
  requireAllowed(actor, { action: "member.invite", roles: [] });
  const caller = (await db.doc(`members/${uid}`).get()).data() ?? {};
  const invited = await db
    .collection("members")
    .where("email", "==", email)
    .where("status", "==", "invited")
    .limit(1)
    .get();
  if (invited.empty)
    throw new HttpsError("not-found", "Nobody is waiting on an invite there.");
  const link = await passwordLink(email, "invite");
  if (!link)
    throw new HttpsError("not-found", "There's no account for that email.");
  const inviter =
    text(caller.gameName) ?? text(caller.displayName) ?? text(caller.email);
  await sendEmail(
    email,
    inviteEmail(await sender(), { email, inviter, link }),
  ).catch((error: unknown) => {
    throw new HttpsError("internal", String(error));
  });
  return { sentTo: email };
});

const resetEvery = 2 * 60 * 1000;

/**
 * Emails a link to choose a new password. Anyone may ask, signed in or not,
 * and the answer is the same whether or not the email has an account, so it
 * never tells which emails do. One email per account every two minutes.
 */
export const sendPasswordReset = onCall(
  { secrets: [resendKey] },
  async (request) => {
    const email = text((request.data as { email?: unknown })?.email)?.trim();
    if (!email || !email.includes("@"))
      throw new HttpsError("invalid-argument", "That isn't an email.");
    const user = await getAuth()
      .getUserByEmail(email)
      .catch(() => null);
    if (!user?.email) return { ok: true };
    const member = (await db.doc(`members/${user.uid}`).get()).data();
    if (!["active", "invited"].includes(String(member?.status)))
      return { ok: true };

    const marker = db.doc(`sentReminders/reset_${user.uid}`);
    const last = toDate((await marker.get()).data()?.at);
    if (last && Date.now() - last.getTime() < resetEvery) return { ok: true };
    await marker.set({ at: FieldValue.serverTimestamp() });

    const link = await passwordLink(user.email, "reset");
    if (!link) return { ok: true };
    await sendEmail(
      user.email,
      resetEmail(await sender(), { email: user.email, link }),
    ).catch((error: unknown) =>
      logger.error("Reset email not sent", { error: String(error) }),
    );
    return { ok: true };
  },
);

const remindEvery = 60 * 60 * 1000;

/** Reminds who hasn't replied to an event; planners only, once an hour. */
export const remindReplies = onCall(
  { secrets: [resendKey] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");
    const eventId = text((request.data as { eventId?: unknown })?.eventId);
    if (!eventId) throw new HttpsError("invalid-argument", "Which event?");
    const members = await activeMembers();
    const item = eventData((await db.doc(`events/${eventId}`).get()).data());
    const actor = await requireActor(db, uid);
    if (item)
      requireAllowed(actor, {
        action: "event.remind",
        event: {
          everyone: item.everyone,
          memberIds: item.memberIds,
          groupIds: item.groupIds,
          createdBy: item.createdBy ?? "",
          ownerRank: 0,
        },
      });
    if (!item?.asksReply)
      throw new HttpsError(
        "failed-precondition",
        "It doesn't ask for replies.",
      );

    // One reminder an hour, whoever presses it.
    const marker = db.doc(`sentReminders/replies_${eventId}`);
    const last = toDate((await marker.get()).data()?.at);
    if (last && Date.now() - last.getTime() < remindEvery)
      throw new HttpsError(
        "resource-exhausted",
        "They were reminded less than an hour ago.",
      );
    await marker.set({ at: FieldValue.serverTimestamp() });

    const waiting = waitingOn(item, members);
    await deliver(
      waiting,
      {
        kind: "replyAsked",
        actorId: uid,
        title: item.title,
        detail: when(item.startsAt, await workspaceFormats()),
        taskId: null,
        eventId,
        groupId: null,
      },
      members,
    );
    return { reminded: waiting.filter((id) => id !== uid).length };
  },
);

/** Ends the signed-in person's sign-ins everywhere (each device within the hour). */
export const signOutEverywhere = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");
  await getAuth().revokeRefreshTokens(uid);
  return { done: true };
});

// #endregion

export { applyPlatformUpdates, platformUpdatesNow } from "./updates/index.js";

export {
  onEventSetDeleted,
  onMemberDeleted,
  onPeopleTagDeleted,
  onRepeatDeleted,
  onWorkGroupDeleted,
  runCleanup,
  weeklyCleanup,
} from "./maintenance/index.js";

export { manage } from "./access/manage.js";
export {
  onGroupLeadsChanged,
  onMemberAccessChanged,
  onRolesChanged,
} from "./access/keepAccess.js";
export {
  onMaintenanceChanged,
  onSignInPicturesChanged,
  onStatusChanged,
  onWorkGroupChanged,
  onWorkspaceSettingsChanged,
} from "./access/activity.js";

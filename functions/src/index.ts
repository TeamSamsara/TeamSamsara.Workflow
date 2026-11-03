// File : /TeamSamsara.Workflow/functions/src/index.ts
// Version : 1.1.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : Playbook's server functions. They watch tasks and events and
// write notifications for the people a change concerns (never the person who
// made it), send reminders before tasks are due and events start, email the
// kinds each person asked for (through Resend), ask people to reply to events
// and tell planners about the replies, send a test email, and sign someone out
// on every device.

import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  FieldValue,
  getFirestore,
  Timestamp,
  type DocumentData,
} from "firebase-admin/firestore";
import { logger, setGlobalOptions } from "firebase-functions/v2";
import { onDocumentWrittenWithAuthContext } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
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
import { emailBody, sentence, when, type Formats } from "./text.js";

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
  roleIds: string[];
  workGroupIds: string[];
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
      roleIds: list(data.roleIds),
      workGroupIds: list(data.workGroupIds),
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

/** Members who can approve tasks (Approve tasks, or Administrator). */
async function approverIds(members: readonly Member[]): Promise<string[]> {
  const grants = ((await db.doc("config/roles").get()).data()?.grants ??
    {}) as Record<string, unknown>;
  const roles = new Set([
    ...list(grants.approveTasks),
    ...list(grants.administrator),
  ]);
  return members
    .filter((member) =>
      [...member.roleIds, "everyone"].some((role) => roles.has(role)),
    )
    .map((member) => member.id);
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
}

async function sendEmail(
  to: string,
  subject: string,
  body: { text: string; html: string },
) {
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
      ...body,
    }),
  });
  if (!response.ok)
    throw new Error(`Resend said ${response.status}: ${await response.text()}`);
}

function linkFor(note: Note): string {
  const base = appUrl.value().replace(/\/+$/, "");
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
): Promise<void> {
  const ids = [...new Set(memberIds)].filter((id) => id !== note.actorId);
  if (ids.length === 0) return;
  const settings = await Promise.all(
    ids.map((id) => db.doc(`notificationSettings/${id}`).get()),
  );
  const group = SettingGroupOf[note.kind];
  const actor =
    members.find((member) => member.id === note.actorId)?.name ?? null;
  await Promise.all(
    ids.map(async (id, index) => {
      const choice = readSettings(settings[index].data());
      const member = members.find((entry) => entry.id === id);
      if (!member) return;
      if (choice.app[group]) {
        await db.collection("notifications").add({
          memberId: id,
          ...note,
          createdAt: FieldValue.serverTimestamp(),
          readAt: null,
        });
      }
      if (choice.email[group] && member.email) {
        const line = sentence(note.kind, {
          actor,
          title: note.title,
          detail: note.detail,
          group: note.groupId ? (groupNames.get(note.groupId) ?? null) : null,
          answer: note.answer ?? null,
        });
        const quote = ["changesAsked", "replyDeclined", "replied"].includes(
          note.kind,
        )
          ? note.detail
          : null;
        await sendEmail(
          member.email,
          line,
          emailBody(line, quote, linkFor(note)),
        ).catch((error: unknown) =>
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
      const ids = await resolve(plan.to, members, () => approverIds(members));
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

export const onEventWritten = onDocumentWrittenWithAuthContext(
  { document: "events/{eventId}", secrets: [resendKey] },
  async (event) => {
    const before = eventData(event.data?.before.data());
    const after = eventData(event.data?.after.data());
    const members = await activeMembers();
    const plans = eventNotifications(before, after, members, new Date());
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
    const line = "Email from Playbook works";
    await sendEmail(
      email,
      line,
      emailBody(
        `${line}. Notifications you switch on for email will arrive here.`,
        null,
        appUrl.value(),
      ),
    ).catch((error: unknown) => {
      throw new HttpsError("internal", String(error));
    });
    return { sentTo: email };
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
    const caller = members.find((member) => member.id === uid);
    const grants = ((await db.doc("config/roles").get()).data()?.grants ??
      {}) as Record<string, unknown>;
    const planners = new Set([
      ...list(grants.planEvents),
      ...list(grants.administrator),
    ]);
    if (
      !caller ||
      ![...caller.roleIds, "everyone"].some((role) => planners.has(role))
    )
      throw new HttpsError("permission-denied", "Only planners can remind.");
    const item = eventData((await db.doc(`events/${eventId}`).get()).data());
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

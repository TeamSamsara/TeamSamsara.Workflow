// File : /TeamSamsara.Workflow/functions/src/model.ts
// Version : 1.2.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The decisions behind notifications, kept free of Firebase so they
// can be tested: what a change to a task or an event tells whom, which kind of
// setting each notification follows, and when a reminder is due.

export const NotificationKinds = [
  "taskGiven",
  "reviewAsked",
  "taskApproved",
  "changesAsked",
  "eventAdded",
  "eventMoved",
  "eventCancelled",
  "taskDue",
  "eventSoon",
  "replyAsked",
  "replyDeclined",
  "replied",
  "setPlanned",
  "tasksMoved",
] as const;
export type NotificationKind = (typeof NotificationKinds)[number];

/** The rows of a member's notification settings. */
export type SettingGroup = "given" | "mine" | "review" | "events";

export const SettingGroupOf: Record<NotificationKind, SettingGroup> = {
  taskGiven: "given",
  taskDue: "given",
  taskApproved: "mine",
  changesAsked: "mine",
  reviewAsked: "review",
  eventAdded: "events",
  eventMoved: "events",
  eventCancelled: "events",
  eventSoon: "events",
  replyAsked: "events",
  replyDeclined: "events",
  replied: "events",
  setPlanned: "events",
  tasksMoved: "given",
};

export type TaskReminder = "off" | "1h" | "2h" | "dayBefore";
export type EventReminder = "off" | "15m" | "1h" | "dayBefore";

export interface NotificationSettings {
  app: Record<SettingGroup, boolean>;
  email: Record<SettingGroup, boolean>;
  taskReminder: TaskReminder;
  eventReminder: EventReminder;
}

export const defaultSettings: NotificationSettings = {
  app: { given: true, mine: true, review: true, events: true },
  email: { given: false, mine: false, review: true, events: false },
  taskReminder: "2h",
  eventReminder: "1h",
};

const groups: readonly SettingGroup[] = ["given", "mine", "review", "events"];

/** A member's saved settings, with anything missing or odd as the defaults. */
export function readSettings(data: unknown): NotificationSettings {
  const value = (data ?? {}) as Record<string, unknown>;
  const flags = (
    stored: unknown,
    fallback: Record<SettingGroup, boolean>,
  ): Record<SettingGroup, boolean> => {
    const map = (stored ?? {}) as Record<string, unknown>;
    return Object.fromEntries(
      groups.map((group) => [
        group,
        typeof map[group] === "boolean"
          ? (map[group] as boolean)
          : fallback[group],
      ]),
    ) as Record<SettingGroup, boolean>;
  };
  const pick = <T extends string>(
    stored: unknown,
    options: readonly T[],
    fallback: T,
  ) => (options.includes(stored as T) ? (stored as T) : fallback);
  return {
    app: flags(value.app, defaultSettings.app),
    email: flags(value.email, defaultSettings.email),
    taskReminder: pick(
      value.taskReminder,
      ["off", "1h", "2h", "dayBefore"],
      "2h",
    ),
    eventReminder: pick(
      value.eventReminder,
      ["off", "15m", "1h", "dayBefore"],
      "1h",
    ),
  };
}

// #region Tasks

export interface TaskData {
  title: string;
  memberId: string | null;
  workGroupId: string | null;
  eventId: string | null;
  sentForReviewBy: string | null;
  sentForReviewAt: Date | null;
  approvedAt: Date | null;
  changesRequested: string | null;
  dueAt: Date | null;
  doneAt: Date | null;
}

/** Who a notification goes to: one member, a work group's members, or the approvers. */
export type Audience =
  { member: string } | { group: string } | { approvers: true };

export interface Planned {
  kind: NotificationKind;
  to: Audience;
  /** The reviewer's words, the new time… */
  detail?: string | null;
}

const sameTime = (a: Date | null, b: Date | null) =>
  (a?.getTime() ?? null) === (b?.getTime() ?? null);

/** Who did the work to be reviewed: whoever sent it, else who it's given to. */
function worker(task: TaskData): Audience | null {
  const id = task.sentForReviewBy ?? task.memberId;
  if (id) return { member: id };
  return task.workGroupId ? { group: task.workGroupId } : null;
}

/** What a task's change tells people. `before` is null for a new task. */
export function taskNotifications(
  before: TaskData | null,
  after: TaskData | null,
): Planned[] {
  if (!after || after.doneAt) return [];
  const planned: Planned[] = [];

  const givenTo =
    after.memberId !== (before?.memberId ?? null) && after.memberId
      ? { member: after.memberId }
      : !after.memberId &&
          after.workGroupId &&
          (after.workGroupId !== (before?.workGroupId ?? null) ||
            (before?.memberId ?? null) !== null)
        ? { group: after.workGroupId }
        : null;
  if (givenTo) planned.push({ kind: "taskGiven", to: givenTo });

  if (
    before &&
    after.sentForReviewAt &&
    !sameTime(after.sentForReviewAt, before.sentForReviewAt)
  )
    planned.push({ kind: "reviewAsked", to: { approvers: true } });

  const by = worker(after);
  if (
    before &&
    by &&
    after.approvedAt &&
    !sameTime(after.approvedAt, before.approvedAt)
  )
    planned.push({ kind: "taskApproved", to: by });

  if (
    before &&
    by &&
    after.changesRequested &&
    after.changesRequested !== before.changesRequested
  )
    planned.push({
      kind: "changesAsked",
      to: by,
      detail: after.changesRequested,
    });

  return planned;
}

// #endregion

// #region Events

export type ReplyAnswer = "going" | "maybe" | "cant";

export interface EventData {
  title: string;
  startsAt: Date;
  everyone: boolean;
  groupIds: string[];
  memberIds: string[];
  repeatId: string | null;
  setId: string | null;
  createdBy: string | null;
  asksReply: boolean;
  requiredIds: string[];
  tellEveryReply: boolean;
  replies: Record<string, { answer: ReplyAnswer; note: string }>;
}

export interface EventPlan {
  kind: "eventAdded" | "eventMoved" | "eventCancelled" | "replyAsked";
  /** Member ids, worked out from the event's audience. */
  memberIds: string[];
}

/** Everyone the event is for. */
export function eventAudience(
  event: Pick<EventData, "everyone" | "groupIds" | "memberIds">,
  members: readonly { id: string; workGroupIds: readonly string[] }[],
): Set<string> {
  if (event.everyone) return new Set(members.map((member) => member.id));
  return new Set([
    ...event.memberIds,
    ...members
      .filter((member) =>
        member.workGroupIds.some((group) => event.groupIds.includes(group)),
      )
      .map((member) => member.id),
  ]);
}

const soonEnough = 30 * 24 * 60 * 60 * 1000;

/**
 * What an event's change tells people. Events made by a repeat or as part of
 * a set don't announce themselves one by one (that would be dozens at once),
 * and nothing is said about events already over or more than 30 days away
 * being cancelled.
 */
export function eventNotifications(
  before: EventData | null,
  after: EventData | null,
  members: readonly { id: string; workGroupIds: readonly string[] }[],
  now: Date,
): EventPlan[] {
  const isPast = (event: EventData) => event.startsAt.getTime() < now.getTime();
  // An event that asks for replies asks the people it adds, instead of just saying so.
  const welcome = (event: EventData) =>
    event.asksReply ? ("replyAsked" as const) : ("eventAdded" as const);
  if (!before && after) {
    if (after.repeatId || after.setId || isPast(after)) return [];
    return [
      { kind: welcome(after), memberIds: [...eventAudience(after, members)] },
    ];
  }
  if (before && !after) {
    const ahead = before.startsAt.getTime() - now.getTime();
    if (ahead < 0 || ahead > soonEnough) return [];
    return [
      {
        kind: "eventCancelled",
        memberIds: [...eventAudience(before, members)],
      },
    ];
  }
  if (!before || !after || isPast(after)) return [];
  const was = eventAudience(before, members);
  const now_ = eventAudience(after, members);
  const plans: EventPlan[] = [];
  const added = [...now_].filter((id) => !was.has(id));
  if (added.length) plans.push({ kind: welcome(after), memberIds: added });
  // Asking starts on an event people were already in: ask those who haven't replied.
  if (after.asksReply && !before.asksReply) {
    const asked = [...now_].filter((id) => was.has(id) && !after.replies[id]);
    if (asked.length) plans.push({ kind: "replyAsked", memberIds: asked });
  }
  if (!sameTime(before.startsAt, after.startsAt)) {
    const stayed = [...now_].filter((id) => was.has(id));
    if (stayed.length) plans.push({ kind: "eventMoved", memberIds: stayed });
  }
  return plans;
}

export interface ReplyPlan {
  kind: "replyDeclined" | "replied";
  /** Who replied. */
  memberId: string;
  answer: ReplyAnswer;
  note: string;
}

/**
 * What new replies tell the planner: a required person who can't go always,
 * every other reply only when the planner asked to hear about every reply.
 * A note changed without a new answer says nothing.
 */
export function replyNotifications(
  before: EventData | null,
  after: EventData | null,
): ReplyPlan[] {
  if (!after?.asksReply) return [];
  const plans: ReplyPlan[] = [];
  for (const [memberId, reply] of Object.entries(after.replies)) {
    if (before?.replies[memberId]?.answer === reply.answer) continue;
    const required = after.requiredIds.includes(memberId);
    if (reply.answer === "cant" && required)
      plans.push({ kind: "replyDeclined", memberId, ...reply });
    else if (after.tellEveryReply)
      plans.push({ kind: "replied", memberId, ...reply });
  }
  return plans;
}

/** Who an event still waits on: the people in it without a reply. */
export function waitingOn(
  event: EventData,
  members: readonly { id: string; workGroupIds: readonly string[] }[],
): string[] {
  return [...eventAudience(event, members)].filter((id) => !event.replies[id]);
}

// #endregion

// #region Reminders

/** The wall-clock parts of a moment in a time zone. */
function wall(date: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

/** The moment it's 9:00 AM in the time zone on the day before `date` there. */
function nineTheDayBefore(date: Date, timeZone: string): Date {
  const { year, month, day } = wall(date, timeZone);
  const guess = new Date(Date.UTC(year, month - 1, day - 1, 9, 0));
  // Shift by the zone's offset at that moment (twice, for daylight saving).
  let result = guess;
  for (let i = 0; i < 2; i++) {
    const seen = wall(result, timeZone);
    const seenUtc = Date.UTC(
      seen.year,
      seen.month - 1,
      seen.day,
      seen.hour,
      seen.minute,
    );
    result = new Date(result.getTime() + (guess.getTime() - seenUtc));
  }
  return result;
}

const minute = 60 * 1000;
const hour = 60 * minute;

/** When to remind about something at `at`; null when reminders are off. */
export function reminderAt(
  at: Date,
  choice: TaskReminder | EventReminder,
  timeZone: string,
): Date | null {
  switch (choice) {
    case "off":
      return null;
    case "15m":
      return new Date(at.getTime() - 15 * minute);
    case "1h":
      return new Date(at.getTime() - hour);
    case "2h":
      return new Date(at.getTime() - 2 * hour);
    case "dayBefore":
      return nineTheDayBefore(at, timeZone);
  }
}

/** Whether a reminder falls in the run that covers (from, to]. */
export function isDueIn(reminder: Date | null, from: Date, to: Date): boolean {
  return (
    reminder !== null &&
    reminder.getTime() > from.getTime() &&
    reminder.getTime() <= to.getTime()
  );
}

// #endregion

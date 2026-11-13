// File : /TeamSamsara.Workflow/engine/src/assign.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Handing out a group's tasks on its own. A task its step gives to
// someone by name stays theirs (even over their limit). Otherwise it goes to
// the least busy person in the group who takes tasks, is free for at least an
// hour in the 6 hours before it's due, and is under the group's daily limit;
// on a tie, to whoever already has a task on the same event. When nobody
// fits, it waits in the group's queue, where anyone in the group can claim
// it, and goes to the first person who frees up. The group's leads hear
// about a task still waiting a day (or the time the group chose) before it's due.

import { dayKey } from "./time.js";
import { hasFreeStretch, type BusyTime, type UsualWeek } from "./free.js";

/** A group's settings for handing out its tasks. */
export interface AssignSettings {
  /** Hands out tasks on its own. Off by default. */
  on: boolean;
  /** The most tasks due in one day it gives one person. */
  dailyLimit: number;
  /** How long before a waiting task is due its leads hear about it. */
  headsUpHours: number;
  /** People in the group it never gives tasks to (leads start here). */
  skip: string[];
}

export const AssignLimits = {
  dailyLimit: { min: 2, max: 10, default: 3 },
  headsUpHours: { choices: [12, 24, 48] as const, default: 24 },
  /** How long someone must be free… */
  freeMinutes: 60,
  /** …within this long before the task is due. */
  windowHours: 6,
  /** Tasks due further ahead than this wait, so plans can still change. */
  reachDays: 14,
} as const;

export const defaultAssign: AssignSettings = {
  on: false,
  dailyLimit: AssignLimits.dailyLimit.default,
  headsUpHours: AssignLimits.headsUpHours.default,
  skip: [],
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)));

/** A group's stored settings, read safely; missing ones take the defaults. */
export function readAssign(value: unknown): AssignSettings {
  if (!value || typeof value !== "object") return { ...defaultAssign };
  const stored = value as Record<string, unknown>;
  const { dailyLimit, headsUpHours } = AssignLimits;
  return {
    on: stored.on === true,
    dailyLimit:
      typeof stored.dailyLimit === "number" &&
      Number.isFinite(stored.dailyLimit)
        ? clamp(stored.dailyLimit, dailyLimit.min, dailyLimit.max)
        : dailyLimit.default,
    headsUpHours: headsUpHours.choices.includes(
      stored.headsUpHours as (typeof headsUpHours.choices)[number],
    )
      ? (stored.headsUpHours as number)
      : headsUpHours.default,
    skip: Array.isArray(stored.skip)
      ? stored.skip.filter((id): id is string => typeof id === "string")
      : [],
  };
}

/** An open task someone already has. */
export interface HeldTask {
  id: string;
  eventId: string | null;
  dueAt: Date | null;
}

/** Someone in the group, with what the hand-out needs to know about them. */
export interface Candidate {
  id: string;
  week: UsualWeek | null;
  busy: readonly BusyTime[];
  /** Their open tasks, from every group. */
  tasks: readonly HeldTask[];
}

/** A task waiting in a group's queue. */
export interface QueuedTask {
  id: string;
  eventId: string | null;
  dueAt: Date | null;
}

export interface HandOutContext {
  settings: AssignSettings;
  now: Date;
  timeZone: string;
}

/** Whether someone is free for an hour in the 6 hours before a task is due. */
export function isFreeBefore(
  candidate: Candidate,
  dueAt: Date,
  { now, timeZone }: Pick<HandOutContext, "now" | "timeZone">,
): boolean {
  const windowStart = dueAt.getTime() - AssignLimits.windowHours * 3_600_000;
  const from = new Date(Math.max(windowStart, now.getTime()));
  return hasFreeStretch(
    candidate.week,
    candidate.busy,
    from,
    dueAt,
    AssignLimits.freeMinutes,
    timeZone,
  );
}

/** How many of someone's open tasks are due on the same day as this moment. */
export function tasksThatDay(
  candidate: Candidate,
  dueAt: Date,
  timeZone: string,
): number {
  const day = dayKey(dueAt, timeZone);
  return candidate.tasks.filter(
    (task) => task.dueAt && dayKey(task.dueAt, timeZone) === day,
  ).length;
}

/** Whether the hand-out looks at this task yet: not past, and close enough. */
export function inReach(task: QueuedTask, now: Date): boolean {
  if (!task.dueAt) return true;
  const due = task.dueAt.getTime();
  return (
    due > now.getTime() &&
    due <= now.getTime() + AssignLimits.reachDays * 86_400_000
  );
}

/** Who gets one task, or null to leave it in the queue. */
export function pickAssignee(
  task: QueuedTask,
  candidates: readonly Candidate[],
  context: HandOutContext,
): string | null {
  const { settings, timeZone } = context;
  if (!inReach(task, context.now)) return null;
  const takers = candidates.filter(
    (candidate) => !settings.skip.includes(candidate.id),
  );
  const load = (candidate: Candidate) =>
    task.dueAt
      ? tasksThatDay(candidate, task.dueAt, timeZone)
      : candidate.tasks.length;
  const fits = takers.filter(
    (candidate) =>
      !task.dueAt ||
      (load(candidate) < settings.dailyLimit &&
        isFreeBefore(candidate, task.dueAt, context)),
  );
  const onEvent = (candidate: Candidate) =>
    task.eventId !== null &&
    candidate.tasks.some((held) => held.eventId === task.eventId);
  const ranked = [...fits].sort(
    (a, b) =>
      load(a) - load(b) ||
      Number(onEvent(b)) - Number(onEvent(a)) ||
      a.tasks.length - b.tasks.length ||
      a.id.localeCompare(b.id),
  );
  return ranked[0]?.id ?? null;
}

export interface HandedOut {
  taskId: string;
  memberId: string;
}

/**
 * Hands out a group's queue, earliest due first, counting each task given
 * against the person's limit for the rest. Returns who gets what; the rest
 * stay in the queue.
 */
export function handOut(
  queue: readonly QueuedTask[],
  candidates: readonly Candidate[],
  context: HandOutContext,
): HandedOut[] {
  if (!context.settings.on) return [];
  const people = candidates.map((candidate) => ({
    ...candidate,
    tasks: [...candidate.tasks],
  }));
  const order = [...queue].sort(
    (a, b) =>
      (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity) ||
      a.id.localeCompare(b.id),
  );
  const given: HandedOut[] = [];
  for (const task of order) {
    const memberId = pickAssignee(task, people, context);
    if (!memberId) continue;
    given.push({ taskId: task.id, memberId });
    people
      .find((person) => person.id === memberId)
      ?.tasks.push({ id: task.id, eventId: task.eventId, dueAt: task.dueAt });
  }
  return given;
}

/** Whether a waiting task is due soon enough that its leads should hear about it. */
export function needsHeadsUp(
  task: QueuedTask,
  settings: AssignSettings,
  now: Date,
): boolean {
  if (!task.dueAt) return false;
  const due = task.dueAt.getTime();
  return (
    due > now.getTime() &&
    due - now.getTime() <= settings.headsUpHours * 3_600_000
  );
}

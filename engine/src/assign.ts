// File : /TeamSamsara.Workflow/engine/src/assign.ts
// Version : 2.0.0
// Latest commit: feature/1.2-workload
// Author : Gerrah
// Purpose : Handing out a group's tasks on its own. Each waiting task goes to
// the person in the group with the most room in the week it's due (see
// workload.ts: a bigger task needs more room) who takes tasks and is free for
// at least an hour in the 6 hours before it's due; on a tie, to whoever
// already has a task on the same event. When nobody has room, it waits in the
// group's queue, where anyone in the group it fits can claim it, and goes to
// the first person who has room. The group's leads hear about a task still
// waiting a day (or the time the group chose) before it's due.

import { hasFreeStretch, type BusyTime, type UsualWeek } from "./free.js";
import { hasRoom, sizeWeight, weekOf, type TaskSize } from "./workload.js";

/** A group's settings for handing out its tasks. */
export interface AssignSettings {
  /** Hands out tasks on its own. Off by default. */
  on: boolean;
  /** How long before a waiting task is due its leads hear about it. */
  headsUpHours: number;
  /** People in the group it never gives tasks to (leads start here). */
  skip: string[];
}

export const AssignLimits = {
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
  headsUpHours: AssignLimits.headsUpHours.default,
  skip: [],
};

/** A group's stored settings, read safely; missing ones take the defaults. */
export function readAssign(value: unknown): AssignSettings {
  if (!value || typeof value !== "object") return { ...defaultAssign };
  const stored = value as Record<string, unknown>;
  const { headsUpHours } = AssignLimits;
  // A daily limit stored before 1.2 is left alone: the usual week took its place.
  return {
    on: stored.on === true,
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
  size: TaskSize;
}

/** Someone in the group, with what the hand-out needs to know about them. */
export interface Candidate {
  id: string;
  /** About how many tasks they take on in a week (see workload.ts). */
  usualWeek: number;
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
  size: TaskSize;
}

export interface HandOutContext {
  settings: AssignSettings;
  now: Date;
  timeZone: string;
  weekStartsOn: "monday" | "sunday";
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

/**
 * How much room someone has in the week a moment falls in: their usual week
 * less their open tasks due that week (bigger ones count twice). A task with
 * no due time counts in this week.
 */
export function roomInWeek(
  candidate: Candidate,
  at: Date,
  context: Pick<HandOutContext, "timeZone" | "weekStartsOn">,
): number {
  const week = weekOf(at, context.timeZone, context.weekStartsOn);
  const load = candidate.tasks.reduce((sum, task) => {
    const due = task.dueAt?.getTime() ?? null;
    return due === null ||
      (due >= week.start.getTime() && due < week.end.getTime())
      ? sum + sizeWeight(task.size)
      : sum;
  }, 0);
  return candidate.usualWeek - load;
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
  const { settings } = context;
  if (!inReach(task, context.now)) return null;
  const at = task.dueAt ?? context.now;
  const room = (candidate: Candidate) => roomInWeek(candidate, at, context);
  const takers = candidates.filter(
    (candidate) => !settings.skip.includes(candidate.id),
  );
  const fits = takers.filter(
    (candidate) =>
      hasRoom(
        candidate.usualWeek,
        candidate.usualWeek - room(candidate),
        task.size,
      ) &&
      (!task.dueAt || isFreeBefore(candidate, task.dueAt, context)),
  );
  const onEvent = (candidate: Candidate) =>
    task.eventId !== null &&
    candidate.tasks.some((held) => held.eventId === task.eventId);
  const ranked = [...fits].sort(
    (a, b) =>
      room(b) - room(a) ||
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
 * against the person's week for the rest. Returns who gets what; the rest
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
      ?.tasks.push({
        id: task.id,
        eventId: task.eventId,
        dueAt: task.dueAt,
        size: task.size,
      });
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

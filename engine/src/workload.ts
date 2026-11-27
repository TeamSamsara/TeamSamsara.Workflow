// File : /TeamSamsara.Workflow/engine/src/workload.ts
// Version : 1.0.0
// Latest commit: feature/1.2-workload
// Author : Gerrah
// Purpose : How full someone's week is. Each person (and each group) has a
// usual week: about how many tasks they take on in a week. A task counts as
// one, or as two when it's a bigger one (a long checklist, several platforms
// to post to, or an approval). The week then reads as one word: Available
// (room even for a bigger task), Limited (room for a quick one), At capacity
// (no room) or Over capacity (given more through an override). Shared by the
// app and the server, so both see the same week.

import { fromWallTime, toWallTime } from "./time.js";

export const WorkloadLimits = {
  /** A person's usual week, in tasks. */
  person: { min: 1, max: 40, default: 3 },
  /** A group's usual week, in tasks, all of it together. */
  group: { min: 1, max: 400 },
  /** A checklist this long makes a task a bigger one. */
  bigChecklist: 3,
  /** Posting to this many platforms makes a task a bigger one. */
  bigPosts: 2,
} as const;

export type TaskSize = "quick" | "bigger";

/** As much of a task as its size reads. */
export interface SizedTask {
  checklist: readonly unknown[] | null;
  posts: readonly unknown[] | null;
  needsApproval: boolean;
}

/** A task's size, from what it asks for. */
export function taskSize(task: SizedTask): TaskSize {
  return task.needsApproval ||
    (task.checklist?.length ?? 0) >= WorkloadLimits.bigChecklist ||
    (task.posts?.length ?? 0) >= WorkloadLimits.bigPosts
    ? "bigger"
    : "quick";
}

/** How much of a week a task takes. */
export const sizeWeight = (size: TaskSize): number =>
  size === "bigger" ? 2 : 1;

export type WeekState = "available" | "limited" | "atCapacity" | "over";

/** A usual week, read safely: a whole number in range, or null for "the usual". */
export function readUsualWeek(
  value: unknown,
  limits: { min: number; max: number } = WorkloadLimits.person,
): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(limits.max, Math.max(limits.min, Math.round(value)))
    : null;
}

/** The week a moment falls in: from the start of its first day to the next. */
export function weekOf(
  at: Date,
  timeZone: string,
  weekStartsOn: "monday" | "sunday",
): { start: Date; end: Date } {
  const wall = toWallTime(at, timeZone);
  // Day of the week of the wall date: 0 is Sunday.
  const weekday = new Date(
    Date.UTC(wall.year, wall.month - 1, wall.day),
  ).getUTCDay();
  const back = (weekday - (weekStartsOn === "monday" ? 1 : 0) + 7) % 7;
  const start = fromWallTime(
    { ...wall, day: wall.day - back, hour: 0, minute: 0 },
    timeZone,
  );
  const end = fromWallTime(
    { ...wall, day: wall.day - back + 7, hour: 0, minute: 0 },
    timeZone,
  );
  return { start, end };
}

/** As much of a task as a week's load reads. */
export interface WeekTask extends SizedTask {
  dueAt: Date | null;
}

/** How much of a week its tasks take: each due in it, by size. */
export function weekLoad(
  tasks: readonly WeekTask[],
  week: { start: Date; end: Date },
): number {
  return tasks.reduce(
    (sum, task) =>
      task.dueAt &&
      task.dueAt.getTime() >= week.start.getTime() &&
      task.dueAt.getTime() < week.end.getTime()
        ? sum + sizeWeight(taskSize(task))
        : sum,
    0,
  );
}

/** The week in one word. */
export function weekState(usualWeek: number, load: number): WeekState {
  const room = usualWeek - load;
  if (room < 0) return "over";
  if (room === 0) return "atCapacity";
  if (room === 1) return "limited";
  return "available";
}

/** Whether a week has room for one more task of this size. */
export function hasRoom(
  usualWeek: number,
  load: number,
  size: TaskSize,
): boolean {
  return usualWeek - load >= sizeWeight(size);
}

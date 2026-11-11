// File : /TeamSamsara.Workflow/app/src/features/tasks/model/doneThisWeek.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Done this week: the tasks finished since the week started (in the
// viewer's time zone), grouped by the day they were done, newest first, and
// how many each day of the week, for the side card's bars.

import { dayKey } from "@/shared/time/dates";
import { toWallTime, fromWallTime } from "@/shared/time/zonedTime";

interface Done {
  doneAt: Date | null;
}

export interface DoneDay<TTask> {
  /** "2026-11-04". */
  key: string;
  /** A moment on that day, for its label. */
  date: Date;
  tasks: TTask[];
}

/** Finished tasks by the day they were done, the latest day and task first. */
export function doneByDay<TTask extends Done>(
  tasks: readonly TTask[],
  since: Date,
  timeZone: string,
): DoneDay<TTask>[] {
  const days = new Map<string, DoneDay<TTask>>();
  const done = tasks
    .filter(
      (task): task is TTask & { doneAt: Date } =>
        task.doneAt !== null && task.doneAt.getTime() >= since.getTime(),
    )
    .sort((a, b) => b.doneAt.getTime() - a.doneAt.getTime());
  for (const task of done) {
    const key = dayKey(task.doneAt, timeZone);
    const day = days.get(key) ?? { key, date: task.doneAt, tasks: [] };
    day.tasks.push(task);
    days.set(key, day);
  }
  return [...days.values()];
}

/** How many were done on each of the week's seven days, first day first. */
export function weekCounts(
  tasks: readonly Done[],
  weekStart: Date,
  timeZone: string,
): number[] {
  const start = toWallTime(weekStart, timeZone);
  const keys = Array.from({ length: 7 }, (_, index) =>
    dayKey(
      fromWallTime({ ...start, day: start.day + index, hour: 12 }, timeZone),
      timeZone,
    ),
  );
  const counts = keys.map(() => 0);
  for (const task of tasks) {
    if (!task.doneAt) continue;
    const index = keys.indexOf(dayKey(task.doneAt, timeZone));
    if (index >= 0) counts[index] += 1;
  }
  return counts;
}

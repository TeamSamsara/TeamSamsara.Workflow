// File : /TeamSamsara.Workflow/app/src/features/workload/model/warnings.ts
// Version : 1.0.0
// Latest commit: feature/1.2-workload-c
// Author : Gerrah
// Purpose : The planning warnings: for each group with a usual week, the
// weeks the tasks an event would add push it over capacity, with how the week
// stood before. A warning never stops anything; tasks nobody has room for
// wait in the group.

import { dayKey } from "@engine/time";
import {
  sizeWeight,
  taskSize,
  weekOf,
  weekState,
  type SizedTask,
  type WeekState,
} from "@engine/workload";
import type { WeekSettings } from "./week";

/** A task an event would add, as the warning reads it. */
export interface PlannedForWarning extends SizedTask {
  workGroupId: string | null;
  dueAt: Date | null;
}

export interface GroupWeekForWarning {
  loads: Record<string, number>;
  base: number;
  usualWeek: number | null;
}

export interface WorkloadWarning {
  groupId: string;
  /** The week's first day. */
  weekStart: Date;
  /** How it stood before these tasks. */
  before: WeekState;
  after: WeekState;
}

export function workloadWarnings(
  planned: readonly PlannedForWarning[],
  groups: ReadonlyMap<string, GroupWeekForWarning>,
  settings: WeekSettings,
): WorkloadWarning[] {
  const added = new Map<
    string,
    { groupId: string; start: Date; load: number }
  >();
  for (const task of planned) {
    if (!task.workGroupId || !task.dueAt) continue;
    const start = weekOf(
      task.dueAt,
      settings.timeZone,
      settings.weekStartsOn,
    ).start;
    const key = `${task.workGroupId}|${dayKey(start, settings.timeZone)}`;
    const entry = added.get(key) ?? {
      groupId: task.workGroupId,
      start,
      load: 0,
    };
    entry.load += sizeWeight(taskSize(task));
    added.set(key, entry);
  }
  const warnings: WorkloadWarning[] = [];
  for (const [key, entry] of added) {
    const group = groups.get(entry.groupId);
    if (!group || group.usualWeek === null) continue;
    const week = key.split("|")[1];
    const load = group.loads[week] ?? group.base;
    const after = weekState(group.usualWeek, load + entry.load);
    if (after !== "over") continue;
    warnings.push({
      groupId: entry.groupId,
      weekStart: entry.start,
      before: weekState(group.usualWeek, load),
      after,
    });
  }
  return warnings.sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
}

/** A group's coming weeks, each as a word, from what the server keeps. */
export function groupComingWeeks(
  group: GroupWeekForWarning,
  now: Date,
  settings: WeekSettings,
  count: number,
): { start: Date; end: Date; state: WeekState }[] {
  if (group.usualWeek === null) return [];
  const weeks: { start: Date; end: Date; state: WeekState }[] = [];
  let at = now;
  for (let index = 0; index < count; index += 1) {
    const week = weekOf(at, settings.timeZone, settings.weekStartsOn);
    const load =
      group.loads[dayKey(week.start, settings.timeZone)] ?? group.base;
    weeks.push({ ...week, state: weekState(group.usualWeek, load) });
    at = new Date(week.end.getTime() + 3 * 24 * 3600 * 1000);
  }
  return weeks;
}

// File : /TeamSamsara.Workflow/functions/src/summaries.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : One notification per person for work done in bulk, kept free of
// Firebase so it can be tested. When a set or repeat is planned: how many
// events, how many of its tasks are given to you and to each of your groups,
// how many of the events you're in, and the first few of your tasks. When a
// saved workflow moves upcoming tasks: how many of yours and your groups'.

import { eventAudience, type EventData } from "./model.js";

export interface SummaryEvent
  extends Pick<EventData, "everyone" | "groupIds" | "memberIds"> {
  id: string;
  startsAt: Date;
}

export interface SummaryTask {
  id: string;
  title: string;
  memberId: string | null;
  workGroupId: string | null;
  /** The workflow step it came from, so the same task across events adds up. */
  stepKey: string | null;
  dueAt: Date | null;
}

export interface SummaryMember {
  id: string;
  workGroupIds: readonly string[];
}

/** One of your tasks across the events: "Prep match graphic · 12 events · first due …". */
export interface SummaryLine {
  title: string;
  events: number;
  firstDue: Date | null;
}

export interface MemberSummary {
  memberId: string;
  /** Tasks given to them by name. */
  mine: number;
  /** Tasks given to each of their groups (and to no one by name), biggest first. */
  groups: { id: string; count: number }[];
  /** How many of the events they're in. */
  inEvents: number;
  /** Their own tasks first, then their groups', at most three, by first due. */
  lines: SummaryLine[];
}

const maxLines = 3;

/** Tasks for this member: theirs by name, or their group's when given to no one. */
function concerns(task: SummaryTask, member: SummaryMember): "mine" | "group" | null {
  if (task.memberId === member.id) return "mine";
  if (!task.memberId && task.workGroupId && member.workGroupIds.includes(task.workGroupId))
    return "group";
  return null;
}

function linesOf(tasks: readonly SummaryTask[]): SummaryLine[] {
  // A step makes one task per event, so its tasks count its events.
  const byStep = new Map<string, SummaryLine>();
  for (const task of tasks) {
    const key = task.stepKey ?? `task:${task.id}`;
    const line = byStep.get(key);
    if (!line) {
      byStep.set(key, {
        title: task.title,
        events: 1,
        firstDue: task.dueAt,
      });
      continue;
    }
    line.events += 1;
    if (task.dueAt && (!line.firstDue || task.dueAt < line.firstDue)) {
      line.firstDue = task.dueAt;
      line.title = task.title;
    }
  }
  return [...byStep.values()].sort(
      (a, b) =>
        (a.firstDue?.getTime() ?? Infinity) - (b.firstDue?.getTime() ?? Infinity),
    );
}

/**
 * Who hears about a set or repeat being planned, and what each is told.
 * Everyone with a task in it, in a group with a task in it, or in one of its
 * events; never whoever planned it.
 */
export function setSummaries(
  events: readonly SummaryEvent[],
  tasks: readonly SummaryTask[],
  members: readonly SummaryMember[],
  actorId: string | null,
): MemberSummary[] {
  const audiences = events.map((event) => eventAudience(event, members));
  return members.flatMap((member) => {
    if (member.id === actorId) return [];
    const theirs = { mine: [] as SummaryTask[], group: [] as SummaryTask[] };
    for (const task of tasks) {
      const kind = concerns(task, member);
      if (kind) theirs[kind].push(task);
    }
    const inEvents = audiences.filter((audience) => audience.has(member.id)).length;
    if (theirs.mine.length + theirs.group.length + inEvents === 0) return [];
    const counts = new Map<string, number>();
    for (const task of theirs.group) {
      const id = task.workGroupId as string;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return [
      {
        memberId: member.id,
        mine: theirs.mine.length,
        groups: [...counts]
          .map(([id, count]) => ({ id, count }))
          .sort((a, b) => b.count - a.count),
        inEvents,
        lines: [...linesOf(theirs.mine), ...linesOf(theirs.group)].slice(0, maxLines),
      },
    ];
  });
}

/**
 * Who hears that a saved workflow moved their upcoming tasks: everyone with
 * one of the moved tasks, or in a group with one; never whoever saved it.
 */
export function syncSummaries(
  tasks: readonly SummaryTask[],
  members: readonly SummaryMember[],
  actorId: string | null,
): MemberSummary[] {
  return setSummaries([], tasks, members, actorId);
}

/** The first moment among the events, for "from Fri, Nov 13". */
export function firstStart(events: readonly SummaryEvent[]): Date | null {
  return events.reduce<Date | null>(
    (first, event) => (!first || event.startsAt < first ? event.startsAt : first),
    null,
  );
}

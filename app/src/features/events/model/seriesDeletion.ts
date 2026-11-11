// File : /TeamSamsara.Workflow/app/src/features/events/model/seriesDeletion.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : What deleting a repeat takes: just this one, this and every later
// one, or the whole series. Which dates' events go, which of their tasks are
// deleted, and which finished tasks stay as history ("Event deleted: …"), so
// the dialog can count them before anything is removed.

import type { TaskRecord } from "@/features/tasks";
import { addDays, repeatDates } from "./repeatRule";
import type { RepeatSchedule } from "../types/repeatTypes";

export const SeriesChoices = ["one", "later", "all"] as const;
export type SeriesChoice = (typeof SeriesChoices)[number];

/**
 * The dates to look for events on. Later dates follow the repeat's schedule
 * as it is now (upcoming events always do); the whole series also looks back
 * to when the repeat started. `until` is the furthest date events are made.
 */
export function seriesDates(
  repeat: RepeatSchedule,
  choice: SeriesChoice,
  date: string,
  until: string,
): string[] {
  if (choice === "one") return [date];
  const from = choice === "later" ? date : repeat.startDate;
  return repeatDates(repeat, from, until);
}

export interface SeriesDeletion {
  eventIds: string[];
  /** Tasks deleted with their events. */
  deleteTaskIds: string[];
  /** Finished tasks that stay, marked with their event. */
  keepTaskIds: string[];
  /** How many of the events' tasks are finished. */
  finished: number;
}

/** Which tasks go and which stay, for these events. */
export function planSeriesDeletion(
  eventIds: readonly string[],
  tasks: readonly Pick<TaskRecord, "id" | "eventId" | "doneAt">[],
  keepDone: boolean,
): SeriesDeletion {
  const events = new Set(eventIds);
  const theirs = tasks.filter(
    (task) => task.eventId !== null && events.has(task.eventId),
  );
  const finished = theirs.filter((task) => task.doneAt !== null);
  const keep = keepDone ? finished : [];
  return {
    eventIds: [...events],
    deleteTaskIds: theirs
      .filter((task) => !keep.includes(task))
      .map((task) => task.id),
    keepTaskIds: keep.map((task) => task.id),
    finished: finished.length,
  };
}

/** The repeat's last date when everything from `date` on goes. */
export function lastDateBefore(date: string): string {
  return addDays(date, -1);
}

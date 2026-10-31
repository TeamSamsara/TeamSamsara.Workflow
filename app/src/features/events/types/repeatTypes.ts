// File : /TeamSamsara.Workflow/app/src/features/events/types/repeatTypes.ts
// Version : 1.0.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : A repeat: an event that happens on set weekdays at a set time
// ("every Monday and Thursday at 7:00 PM"), from a start date until it ends,
// skipping chosen dates. Its events are made a few weeks ahead, each with the
// tasks of its workflows.

import type { DocumentData } from "firebase/firestore";
import {
  createConverter,
  readChoice,
  readDate,
  readMap,
  readNumber,
  readOptionalString,
  readString,
  readStringList,
} from "@/core/data";

export const RepeatEnds = ["never", "onDate", "afterCount"] as const;
export type RepeatEnd = (typeof RepeatEnds)[number];

/** How a repeat runs; dates are "2026-11-09" in the workspace's time zone. */
export interface RepeatSchedule {
  /** 0 = Sunday … 6 = Saturday. */
  weekdays: number[];
  /** "19:00" */
  time: string;
  startDate: string;
  endKind: RepeatEnd;
  endDate: string | null;
  endCount: number | null;
  skipDates: string[];
}

export interface RepeatRecord extends RepeatSchedule {
  id: string;
  title: string;
  eventTypeId: string | null;
  link: string | null;
  details: Record<string, string>;
  notes: string;
  workflowIds: string[];
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Sizes the app keeps to (firestore.rules checks the same). */
export const RepeatLimits = {
  skipDates: 60,
  endCount: 200,
  /** How far ahead events are made. */
  weeksAhead: 8,
} as const;

function readWeekdays(data: DocumentData): number[] {
  const value: unknown = data.weekdays;
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter(
        (day): day is number => Number.isInteger(day) && day >= 0 && day <= 6,
      ),
    ),
  ].sort();
}

function readDetails(data: DocumentData): Record<string, string> {
  return Object.fromEntries(
    Object.entries(readMap(data, "details")).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

export const repeatConverter = createConverter<RepeatRecord>({
  parse: (id, data) => ({
    id,
    title: readString(data, "title"),
    eventTypeId: readOptionalString(data, "eventTypeId"),
    weekdays: readWeekdays(data),
    time: readString(data, "time", "19:00"),
    startDate: readString(data, "startDate"),
    endKind: readChoice(data, "endKind", RepeatEnds, "never"),
    endDate: readOptionalString(data, "endDate"),
    endCount:
      data.endCount === null ? null : readNumber(data, "endCount") || null,
    skipDates: readStringList(data, "skipDates"),
    link: readOptionalString(data, "link"),
    details: readDetails(data),
    notes: readString(data, "notes"),
    workflowIds: readStringList(data, "workflowIds"),
    createdBy: readString(data, "createdBy"),
    createdAt: readDate(data, "createdAt"),
    updatedAt: readDate(data, "updatedAt"),
  }),
  serialize: (repeat) =>
    Object.fromEntries(Object.entries(repeat).filter(([key]) => key !== "id")),
});

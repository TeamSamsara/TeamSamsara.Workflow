// File : /TeamSamsara.Workflow/app/src/features/events/model/planDraft.ts
// Version : 1.2.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : Several events planned at once, as their page holds them: what
// they share (the set's name, type, usual times, a title with {gaps}, who's
// in them) and one row per event (its date, start, end and the values of its
// gaps). Works out the columns, each row's title, what's wrong, the rows a
// weekly pattern adds, and each row's event fields. A gap left empty is "TBD":
// the event is made with the gap still in its title, to fill in later.

import type { ValueText } from "./applyWorkflows";
import { EventGaps, fillGaps, findGaps } from "@/features/workflows";
import { fromDateAndTime } from "@/features/tasks";
import { EventFormText } from "../ui/eventsContent";
import { PlanText } from "../ui/planContent";
import { nobody, type Audience } from "../types/audience";
import {
  defaultEventMinutes,
  EventLimits,
  type EventFields,
} from "../types/eventTypes";
import { noAttendance } from "../types/attendance";
import { EventSetLimits, type EventSetRecord } from "../types/setTypes";
import { draftMinutes, endTimeFor } from "./eventDraft";
import { addDays, repeatDates } from "./repeatRule";

export interface PlanRow {
  /** Stays the same while the row is edited, for React. */
  key: string;
  /** "2027-01-09"; empty until picked. */
  date: string;
  /** "17:00" */
  time: string;
  /** "19:00"; earlier than the start means it ends the next day. */
  endTime: string;
  /** The value of each gap, e.g. { opponent: "Team Nova" }; empty is TBD. */
  values: Record<string, string>;
}

export interface PlanDraft {
  name: string;
  eventTypeId: string | null;
  /** "vs. {opponent}" */
  titlePattern: string;
  /** The usual start and end, for rows added without their own. */
  time: string;
  endTime: string;
  audience: Audience;
  rows: PlanRow[];
}

let rowCount = 0;
/** A new row's key. */
export const rowKey = () => `row${(rowCount += 1)}`;

export function emptyPlan(): PlanDraft {
  return {
    name: "",
    eventTypeId: null,
    titlePattern: "",
    time: "19:00",
    endTime: endTimeFor("19:00", defaultEventMinutes),
    audience: nobody,
    rows: [],
  };
}

/** A plan that adds more events to a set, the way its first ones were made. */
export function planForSet(set: EventSetRecord, time = "19:00"): PlanDraft {
  return {
    name: set.name,
    eventTypeId: set.eventTypeId,
    titlePattern: set.titlePattern,
    time,
    endTime: endTimeFor(time, set.minutes),
    audience: {
      everyone: set.everyone,
      groupIds: set.groupIds,
      memberIds: set.memberIds,
    },
    rows: [],
  };
}

const own = new Set<string>(EventGaps);

/**
 * The plan's columns: the gaps in its title, then the ones its workflows ask
 * for, each once. {title}, {date}, {time} and {link} fill themselves.
 */
export function planGaps(
  titlePattern: string,
  workflowGaps: readonly string[],
): string[] {
  return [...new Set([...findGaps(titlePattern), ...workflowGaps])].filter(
    (gap) => !own.has(gap),
  );
}

function filledValues(
  values: Readonly<Record<string, string>>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values)
      .map(([gap, value]) => [gap, value.trim()])
      .filter(([, value]) => value !== ""),
  );
}

/** The row's title: the pattern with its fields filled; empty ones stay {field}. */
export function rowTitle(
  titlePattern: string,
  row: Pick<PlanRow, "values">,
  text?: ValueText,
) {
  const values = filledValues(row.values);
  return fillGaps(
    titlePattern.trim(),
    text
      ? Object.fromEntries(
          Object.entries(values).map(([key, value]) => [key, text(key, value)]),
        )
      : values,
  );
}

/** The gaps a row leaves empty (TBD). */
export function emptyGaps(row: PlanRow, gaps: readonly string[]): string[] {
  return gaps.filter((gap) => !(row.values[gap] ?? "").trim());
}

/** A row's start, or null while its date or time is missing. */
export function rowStart(row: PlanRow, timeZone: string): Date | null {
  if (!/^\d{2}:\d{2}$/.test(row.time)) return null;
  return fromDateAndTime(row.date, row.time, timeZone);
}

export interface RowProblems {
  date?: string;
  title?: string;
}

export interface PlanProblems {
  name?: string;
  title?: string;
  rows?: string;
  /** By row key. */
  byRow: Map<string, RowProblems>;
  count: number;
}

export function checkPlan(draft: PlanDraft, timeZone: string): PlanProblems {
  const name = draft.name.trim() ? undefined : PlanText.nameRequired;
  const title = draft.titlePattern.trim() ? undefined : PlanText.titleRequired;
  const rows =
    draft.rows.length === 0
      ? PlanText.rowsRequired
      : draft.rows.length > EventSetLimits.events
        ? PlanText.tooManyRows(EventSetLimits.events)
        : undefined;
  const byRow = new Map<string, RowProblems>();
  for (const row of draft.rows) {
    const problems: RowProblems = {};
    if (!rowStart(row, timeZone)) problems.date = EventFormText.dateRequired;
    if (!title && rowTitle(draft.titlePattern, row).length > EventLimits.title)
      problems.title = PlanText.titleTooLong(EventLimits.title);
    if (problems.date || problems.title) byRow.set(row.key, problems);
  }
  return {
    name,
    title,
    rows,
    byRow,
    count: [name, title, rows].filter(Boolean).length + byRow.size,
  };
}

/** The event a row makes; null while its date or time is missing. */
export function rowFields(
  draft: PlanDraft,
  row: PlanRow,
  timeZone: string,
  text?: ValueText,
): EventFields | null {
  const startsAt = rowStart(row, timeZone);
  if (!startsAt) return null;
  return {
    title: rowTitle(draft.titlePattern, row, text),
    eventTypeId: draft.eventTypeId,
    startsAt,
    endsAt: new Date(startsAt.getTime() + draftMinutes(row) * 60_000),
    link: null,
    details: filledValues(row.values),
    notes: "",
    audience: draft.audience,
    attendance: noAttendance,
  };
}

/** Rows in date and time order, keeping rows without a date last. */
export function sortRows(rows: readonly PlanRow[]): PlanRow[] {
  return [...rows].sort((a, b) => {
    if (!a.date || !b.date) return a.date ? -1 : b.date ? 1 : 0;
    return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
  });
}

/** One more row: a week after the last one, at its times. */
export function nextRow(draft: PlanDraft): PlanRow {
  const last = draft.rows.at(-1);
  return {
    key: rowKey(),
    date: last?.date ? addDays(last.date, 7) : "",
    time: last?.time ?? draft.time,
    endTime: last?.endTime ?? draft.endTime,
    values: {},
  };
}

export interface PlanPattern {
  /** 0 = Sunday … 6 = Saturday. */
  weekdays: number[];
  /** Every how many weeks: 1 is every week. */
  every: number;
  from: string;
  until: string;
  time: string;
  endTime: string;
}

/** The dates a weekly pattern falls on, at most as many as a set can make. */
export function patternDates(pattern: PlanPattern): string[] {
  if (!pattern.from || !pattern.until || pattern.until < pattern.from)
    return [];
  const dates = repeatDates(
    {
      weekdays: pattern.weekdays,
      time: pattern.time,
      startDate: pattern.from,
      endKind: "onDate",
      endDate: pattern.until,
      endCount: null,
      skipDates: [],
    },
    pattern.from,
    pattern.until,
  );
  // Every other week (or more): count weeks from the first date's week.
  const every = Math.max(1, Math.round(pattern.every));
  const weekOf = (date: string) =>
    Math.floor(
      (Date.parse(`${date}T00:00:00Z`) -
        Date.parse(`${pattern.from}T00:00:00Z`)) /
        (7 * 86_400_000),
    );
  return dates
    .filter((date) => weekOf(date) % every === 0)
    .slice(0, EventSetLimits.events);
}

/** The rows a pattern adds. */
export function patternRows(pattern: PlanPattern): PlanRow[] {
  return patternDates(pattern).map((date) => ({
    key: rowKey(),
    date,
    time: pattern.time,
    endTime: pattern.endTime,
    values: {},
  }));
}

/** How long the plan's events usually last, in minutes. */
export function planMinutes(draft: PlanDraft): number {
  return draftMinutes(draft);
}

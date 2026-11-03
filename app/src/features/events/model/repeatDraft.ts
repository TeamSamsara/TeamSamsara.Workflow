// File : /TeamSamsara.Workflow/app/src/features/events/model/repeatDraft.ts
// Version : 1.0.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : A repeat as its form holds it (the count as typed), what's wrong
// with it, and back to a schedule. The start date and time come from the
// event's own date and time boxes.

import {
  RepeatLimits,
  type RepeatEnd,
  type RepeatRecord,
  type RepeatSchedule,
} from "../types/repeatTypes";
import { RepeatFieldsText } from "../ui/repeatFieldsContent";
import { weekdayOf } from "./repeatRule";

export interface RepeatDraft {
  weekdays: number[];
  endKind: RepeatEnd;
  endDate: string;
  endCount: string;
  skipDates: string[];
}

/** Repeating on the start date's weekday, with no end. */
export function startRepeatDraft(date: string): RepeatDraft {
  return {
    weekdays: date ? [weekdayOf(date)] : [],
    endKind: "never",
    endDate: "",
    endCount: "6",
    skipDates: [],
  };
}

export function draftFromRepeat(repeat: RepeatSchedule): RepeatDraft {
  return {
    weekdays: [...repeat.weekdays],
    endKind: repeat.endKind,
    endDate: repeat.endDate ?? "",
    endCount: String(repeat.endCount ?? 6),
    skipDates: [...repeat.skipDates],
  };
}

export function scheduleFromDraft(
  draft: RepeatDraft,
  startDate: string,
  time: string,
): RepeatSchedule {
  const count = Number.parseInt(draft.endCount, 10);
  return {
    weekdays: [...new Set(draft.weekdays)].sort(),
    time,
    startDate,
    endKind: draft.endKind,
    endDate: draft.endKind === "onDate" ? draft.endDate || null : null,
    endCount:
      draft.endKind === "afterCount" && Number.isFinite(count) ? count : null,
    skipDates: [...new Set(draft.skipDates)].sort(),
  };
}

export interface RepeatDraftProblems {
  weekdays?: string;
  endDate?: string;
  endCount?: string;
  count: number;
}

export function checkRepeatDraft(
  draft: RepeatDraft,
  startDate: string,
): RepeatDraftProblems {
  const Text = RepeatFieldsText;
  const weekdays =
    draft.weekdays.length > 0 ? undefined : Text.weekdaysRequired;
  const endDate =
    draft.endKind !== "onDate"
      ? undefined
      : !draft.endDate
        ? Text.endDateRequired
        : startDate && draft.endDate < startDate
          ? Text.endDateBefore
          : undefined;
  const count = Number(draft.endCount);
  const endCount =
    draft.endKind === "afterCount" &&
    !(Number.isInteger(count) && count >= 1 && count <= RepeatLimits.endCount)
      ? Text.endCountRange(RepeatLimits.endCount)
      : undefined;
  return {
    weekdays,
    endDate,
    endCount,
    count: [weekdays, endDate, endCount].filter(Boolean).length,
  };
}

/** The repeat's schedule as it is, for comparing with a changed one. */
export function scheduleOf(repeat: RepeatRecord): RepeatSchedule {
  const { weekdays, time, startDate, endKind, endDate, endCount, skipDates } =
    repeat;
  return { weekdays, time, startDate, endKind, endDate, endCount, skipDates };
}

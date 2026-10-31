// File : /TeamSamsara.Workflow/app/src/features/events/model/repeatSummary.ts
// Version : 1.0.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : Says a repeat's schedule in a sentence, weekdays in the
// workspace's week order.

import { formatClockTime } from "@/features/workflows";
import {
  formatDate,
  type ClockFormat,
  type DateFormat,
} from "@/shared/time/dates";
import { dayKeyToDate } from "@/shared/time/monthGrid";
import type { RepeatSchedule } from "../types/repeatTypes";
import { RepeatSummaryText as Text } from "./repeatContent";

function listOf(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")}${Text.and}${items[items.length - 1]}`;
}

/** Weekday numbers in week order (Monday first, or Sunday first). */
export function weekOrder(weekStartsOn: "monday" | "sunday"): number[] {
  return weekStartsOn === "monday"
    ? [1, 2, 3, 4, 5, 6, 0]
    : [0, 1, 2, 3, 4, 5, 6];
}

export function describeRepeat(
  schedule: RepeatSchedule,
  clock: ClockFormat,
  dateFormat: DateFormat,
  weekStartsOn: "monday" | "sunday",
): string {
  const time = formatClockTime(schedule.time, clock);
  const day = (key: string) => formatDate(dayKeyToDate(key), "UTC", dateFormat);
  const days = weekOrder(weekStartsOn).filter((index) =>
    schedule.weekdays.includes(index),
  );
  const every =
    days.length === 7
      ? Text.everyDay(time)
      : Text.every(listOf(days.map((index) => Text.weekdays[index])), time);
  const end =
    schedule.endKind === "onDate" && schedule.endDate
      ? `, ${Text.until(day(schedule.endDate))}`
      : schedule.endKind === "afterCount" && schedule.endCount
        ? `, ${Text.times(schedule.endCount)}`
        : "";
  const skipping =
    schedule.skipDates.length > 0
      ? ` ${Text.skipping(listOf(schedule.skipDates.map(day)))}`
      : "";
  return `${every}${end}.${skipping}`;
}

// File : /TeamSamsara.Workflow/app/src/features/fields/model/fieldText.ts
// Version : 1.0.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : How a field's value reads in text. Values are kept as plain text:
// a person is their member id, a date and time is "2026-11-14T19:00" in the
// workspace's time (the event's own clock), anything else as typed.

import {
  formatDate,
  formatTime,
  type ClockFormat,
  type DateFormat,
} from "@/shared/time/dates";
import type { FieldRecord } from "../types/fieldTypes";

export interface FieldTextOptions {
  dateFormat: DateFormat;
  clock: ClockFormat;
  /** A member's name from their id; null when they're unknown. */
  memberName?: (memberId: string) => string | null;
}

const wallTime = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** "2026-11-14T19:00" as a date that reads the same in UTC. */
function wallDate(value: string): Date | null {
  const match = wallTime.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

/** The value as it goes into text; "" when there's none. */
export function fieldText(
  field: Pick<FieldRecord, "type"> | undefined,
  value: string | undefined,
  options: FieldTextOptions,
): string {
  const raw = value?.trim() ?? "";
  if (!raw || !field) return raw;
  if (field.type === "person") return options.memberName?.(raw) ?? raw;
  if (field.type === "datetime") {
    const date = wallDate(raw);
    return date
      ? `${formatDate(date, "UTC", options.dateFormat)}, ${formatTime(date, "UTC", options.clock)}`
      : raw;
  }
  return raw;
}

// File : /TeamSamsara.Workflow/engine/src/fieldText.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : How a field's value reads in text: a person by name, a date and
// time in the workspace's format, anything else as written.

import {
  formatDate,
  formatTime,
  type ClockFormat,
  type DateFormat,
} from "./time.js";

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
  field: { type: string } | undefined,
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

// File : /TeamSamsara.Workflow/app/src/shared/time/monthGrid.ts
// Version : 1.0.0
// Latest commit: feature/calendar-events
// Author : Gerrah
// Purpose : The weeks a month view shows: whole weeks from the one holding the
// 1st to the one holding the last day, starting on the workspace's first day
// of the week, plus the exact moments the grid starts and ends.

import { dayKey } from "./dates";
import { fromWallTime } from "./zonedTime";

export interface GridDay {
  /** "2026-11-09" */
  key: string;
  year: number;
  month: number;
  day: number;
  /** In the month being shown (not a spill-over day). */
  inMonth: boolean;
  isToday: boolean;
}

export interface MonthGrid {
  weeks: GridDay[][];
  /** Midnight at the start of the first cell. */
  start: Date;
  /** Midnight after the last cell. */
  end: Date;
}

const pad = (value: number) => String(value).padStart(2, "0");

export function monthGrid(
  year: number,
  month: number,
  weekStartsOn: "monday" | "sunday",
  timeZone: string,
  now: Date = new Date(),
): MonthGrid {
  // Calendar maths on plain dates (UTC), then moments in the time zone.
  const first = new Date(Date.UTC(year, month - 1, 1));
  const startIndex = weekStartsOn === "monday" ? 1 : 0;
  const lead = (first.getUTCDay() - startIndex + 7) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = Math.ceil((lead + daysInMonth) / 7) * 7;
  const today = dayKey(now, timeZone);

  const days: GridDay[] = Array.from({ length: cells }, (_unused, index) => {
    const date = new Date(Date.UTC(year, month - 1, 1 - lead + index));
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();
    const key = `${y}-${pad(m)}-${pad(d)}`;
    return {
      key,
      year: y,
      month: m,
      day: d,
      inMonth: m === month,
      isToday: key === today,
    };
  });
  const weeks = Array.from({ length: cells / 7 }, (_unused, week) =>
    days.slice(week * 7, week * 7 + 7),
  );
  const firstCell = days[0];
  const lastCell = days[days.length - 1];
  return {
    weeks,
    start: fromWallTime(
      {
        year: firstCell.year,
        month: firstCell.month,
        day: firstCell.day,
        hour: 0,
        minute: 0,
      },
      timeZone,
    ),
    end: fromWallTime(
      {
        year: lastCell.year,
        month: lastCell.month,
        day: lastCell.day + 1,
        hour: 0,
        minute: 0,
      },
      timeZone,
    ),
  };
}

/** "2026-11" → year and month, or null. */
export function parseMonthKey(
  value: string | null,
): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (!match) return null;
  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? { year: Number(match[1]), month } : null;
}

export function monthKey(year: number, month: number): string {
  return `${year}-${pad(month)}`;
}

/** The month before or after. */
export function addMonths(year: number, month: number, change: number) {
  const index = year * 12 + (month - 1) + change;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** "November 2026". */
export function formatMonth(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

/** A day key ("2026-11-09") as a date at noon UTC, for formatting the day itself. */
export function dayKeyToDate(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

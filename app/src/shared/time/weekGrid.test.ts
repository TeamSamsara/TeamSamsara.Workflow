// File : /TeamSamsara.Workflow/app/src/shared/time/weekGrid.test.ts
// Version : 1.0.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : Tests the week: where it starts, its days in the time zone, and
// how it's said in words.

import { describe, expect, it } from "vitest";
import { formatWeek, parseDayKey, weekOf, weekStartKey } from "./weekGrid";

describe("week", () => {
  it("starts on the workspace's first day of the week", () => {
    expect(weekStartKey("2026-11-01", "monday")).toBe("2026-10-26");
    expect(weekStartKey("2026-11-01", "sunday")).toBe("2026-11-01");
    expect(weekStartKey("2026-11-02", "monday")).toBe("2026-11-02");
  });

  it("has seven days from midnight in the time zone, across a clock change", () => {
    const week = weekOf(
      "2026-10-28",
      "monday",
      "America/Toronto",
      new Date("2026-10-31T18:00:00Z"),
    );
    expect(week.days.map((day) => day.key)).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
    expect(week.start.toISOString()).toBe("2026-10-26T04:00:00.000Z");
    // Clocks go back on Nov 1, so that day is 25 hours long.
    expect(week.end.toISOString()).toBe("2026-11-02T05:00:00.000Z");
    expect(week.days.find((day) => day.isToday)?.key).toBe("2026-10-31");
  });

  it("says the week in words", () => {
    expect(formatWeek(weekOf("2026-10-26", "monday", "UTC"))).toBe(
      "Oct 26 – Nov 1, 2026",
    );
    expect(formatWeek(weekOf("2026-11-02", "monday", "UTC"))).toBe(
      "Nov 2 – 8, 2026",
    );
    expect(formatWeek(weekOf("2026-12-28", "monday", "UTC"))).toBe(
      "Dec 28, 2026 – Jan 3, 2027",
    );
  });

  it("reads a day from the address", () => {
    expect(parseDayKey("2026-11-02")).toBe("2026-11-02");
    expect(parseDayKey("Monday")).toBeNull();
    expect(parseDayKey(null)).toBeNull();
  });
});

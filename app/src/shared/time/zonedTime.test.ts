// File : /TeamSamsara.Workflow/app/src/shared/time/zonedTime.test.ts
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : Tests wall-clock times in a zone, across both daylight saving
// changes in Toronto (8 March and 1 November 2026).

import { describe, expect, it } from "vitest";
import { addCalendarDays, fromWallTime, toWallTime } from "./zonedTime";

const toronto = "America/Toronto";

describe("toWallTime", () => {
  it("reads the date and time in the zone", () => {
    expect(toWallTime(new Date("2026-07-04T23:00:00Z"), toronto)).toEqual({
      year: 2026,
      month: 7,
      day: 4,
      hour: 19,
      minute: 0,
    });
    expect(toWallTime(new Date("2026-01-01T03:30:00Z"), toronto)).toEqual({
      year: 2025,
      month: 12,
      day: 31,
      hour: 22,
      minute: 30,
    });
  });
});

describe("fromWallTime", () => {
  it("finds the moment, in summer and in winter", () => {
    expect(
      fromWallTime(
        { year: 2026, month: 7, day: 4, hour: 19, minute: 0 },
        toronto,
      ),
    ).toEqual(new Date("2026-07-04T23:00:00Z"));
    expect(
      fromWallTime(
        { year: 2026, month: 1, day: 10, hour: 9, minute: 15 },
        toronto,
      ),
    ).toEqual(new Date("2026-01-10T14:15:00Z"));
  });

  it("rolls over days and months", () => {
    expect(
      fromWallTime(
        { year: 2026, month: 3, day: 0, hour: 12, minute: 0 },
        toronto,
      ),
    ).toEqual(new Date("2026-02-28T17:00:00Z"));
  });

  it("moves a skipped time to just after the clocks spring forward", () => {
    const moment = fromWallTime(
      { year: 2026, month: 3, day: 8, hour: 2, minute: 30 },
      toronto,
    );
    expect(toWallTime(moment, toronto).hour).toBe(3);
  });

  it("takes the first of a repeated time when the clocks fall back", () => {
    expect(
      fromWallTime(
        { year: 2026, month: 11, day: 1, hour: 1, minute: 30 },
        toronto,
      ),
    ).toEqual(new Date("2026-11-01T05:30:00Z"));
  });

  it("works in UTC", () => {
    expect(
      fromWallTime({ year: 2026, month: 5, day: 1, hour: 8, minute: 0 }, "UTC"),
    ).toEqual(new Date("2026-05-01T08:00:00Z"));
  });
});

describe("addCalendarDays", () => {
  it("keeps the clock time across a daylight saving change", () => {
    // Saturday 7 March, 7:00 PM (EST) + 1 day = Sunday 8 March, 7:00 PM (EDT).
    const saturday = new Date("2026-03-08T00:00:00Z");
    expect(addCalendarDays(saturday, 1, toronto)).toEqual(
      new Date("2026-03-08T23:00:00Z"),
    );
    expect(
      addCalendarDays(new Date("2026-11-02T00:00:00Z"), -2, toronto),
    ).toEqual(new Date("2026-10-30T23:00:00Z"));
  });
});

// File : /TeamSamsara.Workflow/app/src/features/events/model/repeatRule.test.ts
// Version : 1.0.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : Tests which dates a repeat falls on (weekdays, skipped dates, the
// three kinds of end) and that its time stays put across daylight saving.

import { describe, expect, it } from "vitest";
import type { RepeatSchedule } from "../types/repeatTypes";
import {
  addDays,
  occurrenceDate,
  occurrenceId,
  occurrenceStart,
  repeatDates,
  weekdayOf,
} from "./repeatRule";

// Mondays and Thursdays from Monday 2 November 2026.
const schedule: RepeatSchedule = {
  weekdays: [1, 4],
  time: "19:00",
  startDate: "2026-11-02",
  endKind: "never",
  endDate: null,
  endCount: null,
  skipDates: [],
};

describe("repeatDates", () => {
  it("falls on the chosen weekdays", () => {
    expect(repeatDates(schedule, "2026-11-01", "2026-11-15")).toEqual([
      "2026-11-02",
      "2026-11-05",
      "2026-11-09",
      "2026-11-12",
    ]);
  });

  it("starts no earlier than its start date", () => {
    expect(
      repeatDates(
        { ...schedule, startDate: "2026-11-05" },
        "2026-11-01",
        "2026-11-09",
      ),
    ).toEqual(["2026-11-05", "2026-11-09"]);
  });

  it("leaves out skipped dates", () => {
    expect(
      repeatDates(
        { ...schedule, skipDates: ["2026-11-05"] },
        "2026-11-01",
        "2026-11-10",
      ),
    ).toEqual(["2026-11-02", "2026-11-09"]);
  });

  it("stops on its end date", () => {
    expect(
      repeatDates(
        { ...schedule, endKind: "onDate", endDate: "2026-11-09" },
        "2026-11-01",
        "2026-11-30",
      ),
    ).toEqual(["2026-11-02", "2026-11-05", "2026-11-09"]);
  });

  it("stops after a number of events, counted from the start", () => {
    const three = { ...schedule, endKind: "afterCount" as const, endCount: 3 };
    expect(repeatDates(three, "2026-11-01", "2026-11-30")).toEqual([
      "2026-11-02",
      "2026-11-05",
      "2026-11-09",
    ]);
    expect(repeatDates(three, "2026-11-06", "2026-11-30")).toEqual([
      "2026-11-09",
    ]);
    // A skipped date doesn't use up one of the events.
    expect(
      repeatDates(
        { ...three, skipDates: ["2026-11-05"] },
        "2026-11-01",
        "2026-11-30",
      ),
    ).toEqual(["2026-11-02", "2026-11-09", "2026-11-12"]);
  });

  it("makes nothing without weekdays", () => {
    expect(
      repeatDates({ ...schedule, weekdays: [] }, "2026-11-01", "2026-11-30"),
    ).toEqual([]);
  });
});

describe("occurrences", () => {
  it("keep their time of day across daylight saving", () => {
    // 7:00 PM before (EDT) and after (EST) the clocks fall back on 1 November.
    expect(occurrenceStart("2026-10-29", "19:00", "America/Toronto")).toEqual(
      new Date("2026-10-29T23:00:00Z"),
    );
    expect(occurrenceStart("2026-11-02", "19:00", "America/Toronto")).toEqual(
      new Date("2026-11-03T00:00:00Z"),
    );
  });

  it("have an id per date that reads back", () => {
    const id = occurrenceId("rep1", "2026-11-09");
    expect(id).toBe("rep1_2026-11-09");
    expect(occurrenceDate(id, "rep1")).toBe("2026-11-09");
    expect(occurrenceDate("random", "rep1")).toBeNull();
    expect(occurrenceDate(id, null)).toBeNull();
  });

  it("step through the calendar", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(weekdayOf("2026-11-09")).toBe(1);
  });
});

describe("describeRepeat", () => {
  it("says the schedule in a sentence", async () => {
    const { describeRepeat } = await import("./repeatSummary");
    expect(describeRepeat(schedule, "12h", "monthDay", "monday")).toBe(
      "Every Mon and Thu at 7:00 PM.",
    );
    expect(
      describeRepeat(
        {
          ...schedule,
          weekdays: [0, 1, 3],
          endKind: "onDate",
          endDate: "2026-12-31",
          skipDates: ["2026-12-24"],
        },
        "24h",
        "monthDay",
        "monday",
      ),
    ).toBe("Every Mon, Wed and Sun at 19:00, until Dec 31. Skipping Dec 24.");
    expect(
      describeRepeat(
        { ...schedule, endKind: "afterCount", endCount: 6 },
        "12h",
        "monthDay",
        "sunday",
      ),
    ).toBe("Every Mon and Thu at 7:00 PM, 6 times.");
  });
});

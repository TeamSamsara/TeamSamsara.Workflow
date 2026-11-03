// File : /TeamSamsara.Workflow/app/src/features/tasks/model/formatDue.test.ts
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : Tests how due times read, and the date and time boxes round trip.

import { describe, expect, it } from "vitest";
import { formatDue, fromDateAndTime, toDateAndTime } from "./formatDue";

const toronto = "America/Toronto";
const now = new Date("2026-11-04T19:00:00Z"); // Wed 4 Nov, 2:00 PM

describe("formatDue", () => {
  it("says today, tomorrow and yesterday, else the date", () => {
    const at = (iso: string) =>
      formatDue(new Date(iso), toronto, "12h", "weekdayMonthDay", now);
    expect(at("2026-11-05T00:00:00Z")).toBe("Today, 7:00 PM");
    expect(at("2026-11-05T14:00:00Z")).toBe("Tomorrow, 9:00 AM");
    expect(at("2026-11-03T14:00:00Z")).toBe("Yesterday, 9:00 AM");
    expect(at("2026-11-10T00:00:00Z")).toBe("Mon, Nov 9, 7:00 PM");
  });
});

describe("date and time boxes", () => {
  it("round trip in the workspace's time zone", () => {
    const due = new Date("2026-11-10T00:00:00Z");
    expect(toDateAndTime(due, toronto)).toEqual({
      date: "2026-11-09",
      time: "19:00",
    });
    expect(fromDateAndTime("2026-11-09", "19:00", toronto)).toEqual(due);
  });

  it("uses 5:00 PM without a time, and nothing without a date", () => {
    expect(fromDateAndTime("2026-11-09", "", toronto)).toEqual(
      new Date("2026-11-09T22:00:00Z"),
    );
    expect(fromDateAndTime("", "19:00", toronto)).toBeNull();
    expect(toDateAndTime(null, toronto)).toEqual({ date: "", time: "" });
  });
});

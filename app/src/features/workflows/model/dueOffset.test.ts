// File : /TeamSamsara.Workflow/app/src/features/workflows/model/dueOffset.test.ts
// Version : 1.1.0
// Latest commit: fix/workflow-editor-simpler
// Author : Gerrah
// Purpose : Tests relative due times: the moment they land on (including the
// days Toronto's clocks change) and how they read.

import { describe, expect, it } from "vitest";
import { atTheStart, type DueOffset } from "../types/workflowTypes";
import {
  describeDue,
  dueOrder,
  formatClockTime,
  resolveDue,
} from "./dueOffset";

const toronto = "America/Toronto";
const due = (changes: Partial<DueOffset>): DueOffset => ({
  direction: "before",
  days: 0,
  hours: 0,
  minutes: 0,
  time: null,
  ...changes,
});

// Saturday 4 July 2026, 7:00 PM in Toronto.
const stream = new Date("2026-07-04T23:00:00Z");

describe("resolveDue", () => {
  it("is the start itself at the start", () => {
    expect(resolveDue(stream, atTheStart, toronto)).toEqual(stream);
  });

  it("counts hours and minutes exactly", () => {
    expect(resolveDue(stream, due({ hours: 1 }), toronto)).toEqual(
      new Date("2026-07-04T22:00:00Z"),
    );
    expect(
      resolveDue(
        stream,
        due({ direction: "after", hours: 1, minutes: 30 }),
        toronto,
      ),
    ).toEqual(new Date("2026-07-05T00:30:00Z"));
  });

  it("puts a clock time on the right calendar day", () => {
    expect(
      resolveDue(stream, due({ days: 2, time: "19:00" }), toronto),
    ).toEqual(new Date("2026-07-02T23:00:00Z"));
    expect(
      resolveDue(
        stream,
        due({ direction: "after", days: 1, time: "09:00" }),
        toronto,
      ),
    ).toEqual(new Date("2026-07-05T13:00:00Z"));
    expect(resolveDue(stream, due({ time: "12:00" }), toronto)).toEqual(
      new Date("2026-07-04T16:00:00Z"),
    );
  });

  it("follows the calendar when the clocks change in between", () => {
    // Monday 9 March, 7:00 PM EDT; the clocks sprang forward on the 8th.
    const monday = new Date("2026-03-09T23:00:00Z");
    // 2 days before at the same time is Saturday 7:00 PM EST.
    expect(resolveDue(monday, due({ days: 2 }), toronto)).toEqual(
      new Date("2026-03-08T00:00:00Z"),
    );
    expect(
      resolveDue(monday, due({ days: 2, time: "19:00" }), toronto),
    ).toEqual(new Date("2026-03-08T00:00:00Z"));
    // Monday 2 November, 9:00 AM EST; the clocks fell back on the 1st.
    const fall = new Date("2026-11-02T14:00:00Z");
    expect(resolveDue(fall, due({ days: 3 }), toronto)).toEqual(
      new Date("2026-10-30T13:00:00Z"),
    );
  });
});

describe("describeDue", () => {
  it("says it in everyday words", () => {
    expect(describeDue(atTheStart, "12h")).toBe("When the event starts");
    expect(describeDue(due({ hours: 1 }), "12h")).toBe("1 hour before");
    expect(describeDue(due({ days: 1, hours: 2 }), "12h")).toBe(
      "1 day 2 hours before",
    );
    expect(describeDue(due({ direction: "after", minutes: 30 }), "12h")).toBe(
      "30 minutes after",
    );
    expect(describeDue(due({ days: 1 }), "12h")).toBe("The day before");
    expect(describeDue(due({ days: 7 }), "12h")).toBe("A week before");
    expect(describeDue(due({ days: 3 }), "12h")).toBe("3 days before");
    expect(describeDue(due({ days: 2, time: "19:00" }), "12h")).toBe(
      "2 days before at 7:00 PM",
    );
    expect(describeDue(due({ days: 1, time: "19:00" }), "24h")).toBe(
      "The day before at 19:00",
    );
    expect(
      describeDue(due({ direction: "after", days: 1, time: "09:00" }), "12h"),
    ).toBe("The day after at 9:00 AM");
    expect(describeDue(due({ time: "00:30" }), "12h")).toBe(
      "The same day at 12:30 AM",
    );
    expect(describeDue(due({}), "12h")).toBe("When the event starts");
  });

  it("formats clock times both ways", () => {
    expect(formatClockTime("12:05", "12h")).toBe("12:05 PM");
    expect(formatClockTime("7:00", "24h")).toBe("07:00");
  });
});

describe("dueOrder", () => {
  it("puts earlier due times first", () => {
    const offsets = [
      due({ direction: "after", days: 1, time: "09:00" }),
      due({ hours: 1 }),
      atTheStart,
      due({ days: 2, time: "19:00" }),
      due({ days: 1 }),
    ];
    const sorted = [...offsets].sort((a, b) => dueOrder(a) - dueOrder(b));
    expect(sorted.map((offset) => describeDue(offset, "12h"))).toEqual([
      "2 days before at 7:00 PM",
      "The day before",
      "1 hour before",
      "When the event starts",
      "The day after at 9:00 AM",
    ]);
  });
});

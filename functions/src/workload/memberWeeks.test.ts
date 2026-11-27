// File : /TeamSamsara.Workflow/functions/src/workload/memberWeeks.test.ts
// Version : 1.2.0
// Latest commit: feature/1.2-workload-checks
// Author : Gerrah
// Purpose : Tests someone's weeks as one word each, a group's weeks as how
// much each takes, and which task changes make them be worked out again.

import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";
import {
  groupsTouched,
  groupWeeks,
  memberWeeks,
  touchesWeeks,
  needsWeekKey,
  weekKeyOf,
} from "./memberWeeks.js";

const at = (iso: string) => new Date(iso);

describe("memberWeeks", () => {
  it("gives each week with tasks its word, and an empty week its own", () => {
    const weeks = memberWeeks(
      [
        { dueAt: at("2026-11-18T17:00:00Z"), size: "bigger" },
        { dueAt: at("2026-11-20T17:00:00Z"), size: "quick" },
        { dueAt: at("2026-11-24T17:00:00Z"), size: "quick" },
      ],
      3,
      "America/Toronto",
      "monday",
    );
    expect(weeks).toEqual({
      states: { "2026-11-16": "atCapacity", "2026-11-23": "available" },
      empty: "available",
    });
  });

  it("counts a task with no due time in every week", () => {
    const weeks = memberWeeks(
      [
        { dueAt: null, size: "quick" },
        { dueAt: at("2026-11-18T17:00:00Z"), size: "quick" },
      ],
      3,
      "America/Toronto",
      "monday",
    );
    expect(weeks).toEqual({
      states: { "2026-11-16": "limited" },
      empty: "available",
    });
    expect(
      memberWeeks([{ dueAt: null, size: "bigger" }], 3, "UTC", "monday").empty,
    ).toBe("limited");
  });
});

describe("touchesWeeks", () => {
  const task = {
    memberId: "sam",
    dueAt: Timestamp.fromDate(at("2026-11-18T17:00:00Z")),
    doneAt: null,
    checklist: null,
    posts: null,
    needsApproval: false,
  };

  it("finds the people whose weeks a change touches", () => {
    expect(touchesWeeks(task, { ...task, memberId: "jo" })).toEqual([
      "sam",
      "jo",
    ]);
    expect(touchesWeeks(task, { ...task, needsApproval: true })).toEqual([
      "sam",
    ]);
    expect(touchesWeeks(task, { ...task, doneAt: Timestamp.now() })).toEqual([
      "sam",
    ]);
    expect(touchesWeeks(undefined, task)).toEqual(["sam"]);
    expect(touchesWeeks(task, { ...task, title: "Renamed" })).toEqual([]);
  });
});

describe("groupWeeks", () => {
  it("adds up each week's tasks, bigger ones twice", () => {
    expect(
      groupWeeks(
        [
          { dueAt: at("2026-11-18T17:00:00Z"), size: "bigger" },
          { dueAt: at("2026-11-20T17:00:00Z"), size: "quick" },
          { dueAt: null, size: "quick" },
        ],
        15,
        "America/Toronto",
        "monday",
      ),
    ).toEqual({ loads: { "2026-11-16": 4 }, base: 1, usualWeek: 15 });
  });

  it("finds the groups a task change touches", () => {
    const task = {
      workGroupId: "design",
      dueAt: Timestamp.fromDate(at("2026-11-18T17:00:00Z")),
      doneAt: null,
      checklist: null,
      posts: null,
      needsApproval: false,
    };
    expect(groupsTouched(task, { ...task, workGroupId: "social" })).toEqual([
      "design",
      "social",
    ]);
    expect(groupsTouched(task, { ...task, memberId: "sam" })).toEqual([]);
  });
});

describe("weekKeyOf and needsWeekKey", () => {
  const due = (iso: string) => Timestamp.fromDate(new Date(iso));

  it("keys a due time by its week's first day, in the workspace's zone", () => {
    // Sunday 9 PM in Toronto is Monday in UTC: still the week of Nov 9.
    expect(
      weekKeyOf(new Date("2026-11-16T02:00:00Z"), "America/Toronto", "monday"),
    ).toBe("2026-11-09");
    expect(weekKeyOf(null, "America/Toronto", "monday")).toBeNull();
  });

  it("works it out when it's missing or the due time moved", () => {
    const task = { dueAt: due("2026-11-18T15:00:00Z"), doneAt: null };
    expect(needsWeekKey(undefined, task)).toBe(true);
    expect(needsWeekKey(task, { ...task, weekKey: "2026-11-16" })).toBe(false);
    expect(
      needsWeekKey(
        { ...task, weekKey: "2026-11-16" },
        { ...task, dueAt: due("2026-11-25T15:00:00Z"), weekKey: "2026-11-16" },
      ),
    ).toBe(true);
  });

  it("clears it with no due time, and leaves finished tasks alone", () => {
    expect(
      needsWeekKey(undefined, { dueAt: null, doneAt: null, weekKey: "x" }),
    ).toBe(true);
    expect(needsWeekKey(undefined, { dueAt: null, doneAt: null })).toBe(false);
    expect(
      needsWeekKey(undefined, {
        dueAt: due("2026-11-18T15:00:00Z"),
        doneAt: due("2026-11-17T15:00:00Z"),
      }),
    ).toBe(false);
  });
});

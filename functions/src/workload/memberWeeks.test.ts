// File : /TeamSamsara.Workflow/functions/src/workload/memberWeeks.test.ts
// Version : 1.0.0
// Latest commit: feature/1.2-workload-b
// Author : Gerrah
// Purpose : Tests someone's weeks as one word each, and which task changes
// make them be worked out again.

import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";
import { memberWeeks, touchesWeeks } from "./memberWeeks.js";

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

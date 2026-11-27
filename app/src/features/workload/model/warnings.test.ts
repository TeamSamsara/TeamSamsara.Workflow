// File : /TeamSamsara.Workflow/app/src/features/workload/model/warnings.test.ts
// Version : 1.0.0
// Latest commit: feature/1.2-workload-c
// Author : Gerrah
// Purpose : Tests the planning warnings and a group's coming weeks.

import { describe, expect, it } from "vitest";
import {
  groupComingWeeks,
  workloadWarnings,
  type GroupWeekForWarning,
} from "./warnings";

const settings = {
  timeZone: "America/Toronto",
  weekStartsOn: "monday" as const,
};
const task = (due: string, bigger = false, workGroupId = "design") => ({
  workGroupId,
  dueAt: new Date(due),
  checklist: bigger ? [1, 2, 3] : null,
  posts: null,
  needsApproval: false,
});

describe("workloadWarnings", () => {
  const groups = new Map<string, GroupWeekForWarning>([
    ["design", { loads: { "2026-11-23": 13 }, base: 0, usualWeek: 15 }],
    ["social", { loads: {}, base: 0, usualWeek: null }],
  ]);

  it("warns for the weeks an event pushes a group over, with how it stood", () => {
    const warnings = workloadWarnings(
      [task("2026-11-24T17:00:00Z", true), task("2026-11-25T17:00:00Z")],
      groups,
      settings,
    );
    expect(warnings).toEqual([
      {
        groupId: "design",
        weekStart: new Date("2026-11-23T05:00:00.000Z"),
        before: "available",
        after: "over",
      },
    ]);
  });

  it("stays quiet when it still fits, or the group has no usual week", () => {
    expect(
      workloadWarnings([task("2026-11-24T17:00:00Z")], groups, settings),
    ).toEqual([]);
    expect(
      workloadWarnings(
        [task("2026-11-24T17:00:00Z", true, "social")],
        groups,
        settings,
      ),
    ).toEqual([]);
  });
});

describe("groupComingWeeks", () => {
  it("reads four weeks from this one", () => {
    const weeks = groupComingWeeks(
      { loads: { "2026-11-23": 15 }, base: 0, usualWeek: 15 },
      new Date("2026-11-18T17:00:00Z"),
      settings,
      4,
    );
    expect(weeks.map((week) => week.state)).toEqual([
      "available",
      "atCapacity",
      "available",
      "available",
    ]);
  });
});

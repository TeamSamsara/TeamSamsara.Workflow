// File : /TeamSamsara.Workflow/app/src/features/tasks/model/groupByDue.test.ts
// Version : 1.1.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tests sorting tasks into Late, Today, Next 7 days, Later and No
// due date in Toronto, and where weeks start (Monday or Sunday).

import { describe, expect, it } from "vitest";
import { isAssignedTo, isGivenToMe } from "./assignment";
import {
  dueGroup,
  groupByDue,
  startOfNextWeek,
  startOfWeek,
} from "./groupByDue";

const toronto = "America/Toronto";
// Wednesday 4 November 2026, 2:00 PM in Toronto.
const now = new Date("2026-11-04T19:00:00Z");
const at = (iso: string) => new Date(iso);

describe("dueGroup", () => {
  it("puts each due time in its group", () => {
    expect(dueGroup(null, now, toronto)).toBe("noDue");
    expect(dueGroup(at("2026-11-04T14:00:00Z"), now, toronto)).toBe("late");
    expect(dueGroup(at("2026-11-04T23:00:00Z"), now, toronto)).toBe("today");
    expect(dueGroup(at("2026-11-08T23:00:00Z"), now, toronto)).toBe("next7");
    // Wednesday 11 November, 11:00 PM: the 7th day from today.
    expect(dueGroup(at("2026-11-12T04:00:00Z"), now, toronto)).toBe("next7");
    // Thursday 12 November: past the next 7 days.
    expect(dueGroup(at("2026-11-12T15:00:00Z"), now, toronto)).toBe("later");
  });

  it("treats a time late tonight in Toronto as today", () => {
    // 11:30 PM in Toronto is already the next day in UTC.
    expect(dueGroup(at("2026-11-05T04:30:00Z"), now, toronto)).toBe("today");
  });
});

describe("startOfWeek", () => {
  it("is midnight on this week's first day", () => {
    expect(startOfWeek(now, toronto, "monday")).toEqual(
      at("2026-11-02T05:00:00Z"),
    );
    expect(startOfWeek(now, toronto, "sunday")).toEqual(
      at("2026-11-01T04:00:00Z"),
    );
  });
});

describe("startOfNextWeek", () => {
  it("is midnight on the next week's first day", () => {
    expect(startOfNextWeek(now, toronto, "monday")).toEqual(
      at("2026-11-09T05:00:00Z"),
    );
    expect(startOfNextWeek(now, toronto, "sunday")).toEqual(
      at("2026-11-08T05:00:00Z"),
    );
  });
});

describe("groupByDue", () => {
  it("keeps each group earliest first", () => {
    const tasks = [
      { id: "b", dueAt: at("2026-11-04T23:30:00Z") },
      { id: "none", dueAt: null },
      { id: "a", dueAt: at("2026-11-04T21:00:00Z") },
      { id: "late", dueAt: at("2026-11-02T15:00:00Z") },
    ];
    const groups = groupByDue(tasks, now, toronto);
    expect(groups.today.map((task) => task.id)).toEqual(["a", "b"]);
    expect(groups.late.map((task) => task.id)).toEqual(["late"]);
    expect(groups.noDue.map((task) => task.id)).toEqual(["none"]);
  });
});

describe("assignment", () => {
  const viewer = { id: "sam", workGroupIds: ["design"] };
  it("counts tasks given to the person or their groups", () => {
    expect(isGivenToMe({ memberId: "sam", workGroupId: null }, viewer)).toBe(
      true,
    );
    expect(
      isAssignedTo({ memberId: null, workGroupId: "design" }, viewer),
    ).toBe(true);
    expect(
      isAssignedTo({ memberId: "alex", workGroupId: "social" }, viewer),
    ).toBe(false);
    expect(isAssignedTo({ memberId: null, workGroupId: null }, viewer)).toBe(
      false,
    );
  });
});

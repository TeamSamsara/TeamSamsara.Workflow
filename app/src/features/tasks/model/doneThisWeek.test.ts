// File : /TeamSamsara.Workflow/app/src/features/tasks/model/doneThisWeek.test.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tests grouping finished tasks by day and counting each day of the week.

import { describe, expect, it } from "vitest";
import { doneByDay, weekCounts } from "./doneThisWeek";

const toronto = "America/Toronto";
// Monday 2 November 2026, midnight in Toronto.
const weekStart = new Date("2026-11-02T05:00:00Z");
const done = (id: string, iso: string | null) => ({
  id,
  doneAt: iso ? new Date(iso) : null,
});

const tasks = [
  done("mon", "2026-11-02T15:00:00Z"),
  done("wedLate", "2026-11-05T03:30:00Z"), // Wed 10:30 PM in Toronto
  done("wedNoon", "2026-11-04T17:00:00Z"),
  done("lastWeek", "2026-11-01T15:00:00Z"),
  done("open", null),
];

describe("doneByDay", () => {
  it("groups this week's finished tasks by day, newest first", () => {
    const days = doneByDay(tasks, weekStart, toronto);
    expect(days.map((day) => day.key)).toEqual(["2026-11-04", "2026-11-02"]);
    expect(days[0].tasks.map((task) => task.id)).toEqual([
      "wedLate",
      "wedNoon",
    ]);
  });
});

describe("weekCounts", () => {
  it("counts each day of the week", () => {
    expect(weekCounts(tasks, weekStart, toronto)).toEqual([
      1, 0, 2, 0, 0, 0, 0,
    ]);
  });
});

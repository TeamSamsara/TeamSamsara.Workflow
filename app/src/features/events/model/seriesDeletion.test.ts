// File : /TeamSamsara.Workflow/app/src/features/events/model/seriesDeletion.test.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tests which dates and tasks deleting a repeat takes, and that
// finished tasks stay as history unless told otherwise.

import { describe, expect, it } from "vitest";
import { planSeriesDeletion, seriesDates } from "./seriesDeletion";

// Practice every Tuesday and Thursday from Tue, Nov 3.
const practice = {
  weekdays: [2, 4],
  time: "19:00",
  startDate: "2026-11-03",
  endKind: "never" as const,
  endDate: null,
  endCount: null,
  skipDates: ["2026-11-05"],
};

describe("seriesDates", () => {
  it("takes one date, the dates from it, or every date", () => {
    expect(seriesDates(practice, "one", "2026-11-10", "2026-11-19")).toEqual([
      "2026-11-10",
    ]);
    expect(seriesDates(practice, "later", "2026-11-10", "2026-11-19")).toEqual([
      "2026-11-10",
      "2026-11-12",
      "2026-11-17",
      "2026-11-19",
    ]);
    expect(seriesDates(practice, "all", "2026-11-10", "2026-11-12")).toEqual([
      "2026-11-03",
      "2026-11-10",
      "2026-11-12",
    ]);
  });
});

describe("planSeriesDeletion", () => {
  const tasks = [
    { id: "a", eventId: "e1", doneAt: null },
    { id: "b", eventId: "e1", doneAt: new Date() },
    { id: "c", eventId: "e2", doneAt: null },
    { id: "other", eventId: "e9", doneAt: null },
  ];

  it("keeps finished tasks as history by default", () => {
    expect(planSeriesDeletion(["e1", "e2"], tasks, true)).toEqual({
      eventIds: ["e1", "e2"],
      deleteTaskIds: ["a", "c"],
      keepTaskIds: ["b"],
      finished: 1,
    });
  });

  it("deletes them too when asked", () => {
    const plan = planSeriesDeletion(["e1", "e2"], tasks, false);
    expect(plan.deleteTaskIds).toEqual(["a", "b", "c"]);
    expect(plan.keepTaskIds).toEqual([]);
  });
});

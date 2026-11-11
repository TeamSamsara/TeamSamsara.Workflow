// File : /TeamSamsara.Workflow/functions/src/summaries.test.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tests the one-per-person summaries: who hears about a planned set
// or repeat and a workflow sync, their counts, and their first few tasks.

import { describe, expect, it } from "vitest";
import {
  firstStart,
  setSummaries,
  syncSummaries,
  type SummaryEvent,
  type SummaryTask,
} from "./summaries.js";

const members = [
  { id: "jordan", workGroupIds: ["marketing"] },
  { id: "salty", workGroupIds: ["bloom"] },
  { id: "kappa", workGroupIds: ["marketing"] },
  { id: "david", workGroupIds: [] },
];

const fridays = [13, 20, 27].map(
  (day): SummaryEvent => ({
    id: `match${day}`,
    startsAt: new Date(Date.UTC(2026, 10, day, 22)),
    everyone: false,
    groupIds: ["bloom"],
    memberIds: [],
  }),
);

const tasks: SummaryTask[] = fridays.flatMap((event, index) => [
  {
    id: `${event.id}-graphic`,
    title: `Prep match graphic ${index}`,
    memberId: "kappa",
    workGroupId: "marketing",
    stepKey: "promo:graphic",
    dueAt: new Date(event.startsAt.getTime() - 2 * 86_400_000),
  },
  {
    id: `${event.id}-caption`,
    title: "Prep caption",
    memberId: null,
    workGroupId: "marketing",
    stepKey: "promo:caption",
    dueAt: new Date(event.startsAt.getTime() - 86_400_000),
  },
]);

describe("setSummaries", () => {
  it("tells each person their own, their groups' and their events' counts", () => {
    const summaries = setSummaries(fridays, tasks, members, "jordan");
    expect(summaries.map((summary) => summary.memberId)).toEqual([
      "salty",
      "kappa",
    ]);
    const kappa = summaries[1];
    expect(kappa.mine).toBe(3);
    expect(kappa.groups).toEqual([{ id: "marketing", count: 3 }]);
    expect(kappa.inEvents).toBe(0);
    const salty = summaries[0];
    expect(salty).toMatchObject({ mine: 0, groups: [], inEvents: 3 });
  });

  it("lists their tasks by step across events, their own first", () => {
    const [, kappa] = setSummaries(fridays, tasks, members, "jordan");
    expect(kappa.lines).toEqual([
      {
        title: "Prep match graphic 0",
        events: 3,
        firstDue: new Date(Date.UTC(2026, 10, 11, 22)),
      },
      {
        title: "Prep caption",
        events: 3,
        firstDue: new Date(Date.UTC(2026, 10, 12, 22)),
      },
    ]);
  });

  it("never tells whoever planned it, or people it doesn't concern", () => {
    const summaries = setSummaries(fridays, tasks, members, "kappa");
    expect(summaries.map((summary) => summary.memberId)).toEqual([
      "jordan",
      "salty",
    ]);
    expect(summaries.find((summary) => summary.memberId === "david")).toBe(
      undefined,
    );
  });
});

describe("syncSummaries", () => {
  it("counts the moved tasks for each person and group", () => {
    const moved = tasks.filter((task) => task.stepKey === "promo:caption");
    const summaries = syncSummaries(moved, members, "salty");
    expect(summaries).toEqual([
      expect.objectContaining({
        memberId: "jordan",
        mine: 0,
        groups: [{ id: "marketing", count: 3 }],
        inEvents: 0,
      }),
      expect.objectContaining({ memberId: "kappa", mine: 0 }),
    ]);
  });
});

describe("firstStart", () => {
  it("is the earliest event, or null with none", () => {
    expect(firstStart([...fridays].reverse())).toEqual(fridays[0].startsAt);
    expect(firstStart([])).toBe(null);
  });
});

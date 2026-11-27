// File : /TeamSamsara.Workflow/functions/src/taskOrder.test.ts
// Version : 1.0.0
// Latest commit: feature/1.2-tasks-follow-order
// Author : Gerrah
// Purpose : Tests what a task change means for the tasks after it: which it
// unlocks, and the due time of a Due from task once the one it counts from
// is done (unless that due time was set by hand).

import { describe, expect, it } from "vitest";
import type { TaskRow } from "./engineData.js";
import { orderEffects } from "./taskOrder.js";

const row = (id: string, extra: Partial<TaskRow> = {}): TaskRow => ({
  id,
  title: id,
  notes: "",
  workGroupId: "marketing",
  memberId: null,
  dueAt: new Date("2026-12-03T17:00:00Z"),
  checklist: null,
  posts: null,
  doneAt: null,
  editedParts: [],
  eventId: "launch",
  workflowId: "w",
  stepId: id,
  approvedAt: null,
  sentForReviewAt: null,
  liveLink: null,
  startedAnyway: null,
  waitsOn: [],
  waitFor: "all",
  whenLate: "wait",
  dueFromOffset: null,
  ...extra,
});

const now = new Date("2026-12-01T12:00:00Z");
const offset = {
  direction: "after" as const,
  days: 1,
  hours: 0,
  minutes: 0,
  time: "13:00",
};

describe("orderEffects", () => {
  const banner = row("banner");
  const post = row("post", {
    waitsOn: [{ stepId: "banner", condition: "approved", dueFrom: false }],
  });
  const recap = row("recap", {
    waitsOn: [{ stepId: "banner", condition: "done", dueFrom: true }],
    dueFromOffset: offset,
  });

  it("finds the tasks a change unlocks", () => {
    const approved = { ...banner, approvedAt: now };
    const effects = orderEffects(
      banner,
      approved,
      [approved, post, recap],
      now,
      "America/Toronto",
    );
    expect(effects.unlocked.map((task) => task.id)).toEqual(["post"]);
    expect(effects.dues).toEqual([]);
  });

  it("moves a Due from task's due time once the task it counts from is done", () => {
    const finished = { ...banner, doneAt: new Date("2026-12-01T20:00:00Z") };
    const effects = orderEffects(
      banner,
      finished,
      [finished, post, recap],
      now,
      "America/Toronto",
    );
    expect(effects.unlocked.map((task) => task.id)).toEqual(["recap"]);
    expect(effects.dues).toEqual([
      { taskId: "recap", dueAt: new Date("2026-12-02T18:00:00Z") },
    ]);
  });

  it("keeps a due time someone set by hand, and ignores changes that don't matter", () => {
    const finished = { ...banner, doneAt: now };
    const edited = { ...recap, editedParts: ["due"] };
    expect(
      orderEffects(banner, finished, [finished, edited], now, "America/Toronto")
        .dues,
    ).toEqual([]);
    const renamed = { ...banner, title: "Launch banner" };
    expect(
      orderEffects(banner, renamed, [renamed, post], now, "America/Toronto"),
    ).toEqual({ unlocked: [], dues: [], waiting: [] });
  });
});

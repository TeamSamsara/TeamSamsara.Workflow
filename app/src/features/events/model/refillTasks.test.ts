// File : /TeamSamsara.Workflow/app/src/features/events/model/refillTasks.test.ts
// Version : 1.0.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : Tests which tasks follow an event's new values: text still as the
// old values filled it changes, text edited by hand and finished tasks stay.

import { describe, expect, it } from "vitest";
import type { TaskRecord } from "@/features/tasks";
import { newStep, type WorkflowRecord } from "@/features/workflows";
import { applyWorkflows } from "./applyWorkflows";
import { planRefill } from "./refillTasks";

const formats = {
  timeZone: "America/Toronto",
  clock: "12h",
  dateFormat: "weekdayMonthDay",
} as const;

const before = {
  title: "vs. Kitsune",
  startsAt: new Date("2026-11-15T00:00:00Z"),
  link: null,
  details: { opponent: "Kitsune" },
};
const after = { ...before, details: { opponent: "Kitsune Esports" } };

const workflow: WorkflowRecord = {
  id: "promo",
  name: "Match day promo",
  description: "",
  eventTypeId: null,
  archived: false,
  createdAt: null,
  updatedAt: null,
  steps: ["graphic", "post", "recap"].map((id) => ({
    ...newStep(),
    id,
    title: `${id} vs {opponent}`,
    notes: "Use the {opponent} logo.",
    checklist: [{ id: "c1", text: "Tag {opponent}" }],
    posts: [
      {
        platformId: "x",
        formatId: null,
        texts: { post: "We face {opponent}!" },
      },
    ],
  })),
};

/** The tasks as they were made, as records. */
function made(): TaskRecord[] {
  return applyWorkflows(before, [workflow], formats).map(
    ({ workflowId, stepId, ...task }, index) => ({
      ...task,
      id: `t${index}`,
      statusId: "todo",
      liveLink: null,
      eventId: "match",
      workflowId,
      stepId,
      sentForReviewBy: null,
      sentForReviewAt: null,
      approvedBy: null,
      approvedAt: null,
      changesRequested: null,
      createdBy: "alex",
      createdAt: null,
      updatedAt: null,
      doneAt: null,
    }),
  );
}

describe("planRefill", () => {
  it("fills every untouched piece again", () => {
    const plan = planRefill(made(), [workflow], before, after, formats);
    expect(plan.kept).toEqual([]);
    const first = plan.updates[0];
    expect(first.changes.title).toBe("graphic vs Kitsune Esports");
    expect(first.changes.notes).toBe("Use the Kitsune Esports logo.");
    expect(first.changes.checklist?.[0].text).toBe("Tag Kitsune Esports");
    expect(first.changes.posts?.[0].texts.post).toBe(
      "We face Kitsune Esports!",
    );
  });

  it("keeps a piece edited by hand, and its ticks", () => {
    const tasks = made();
    tasks[0] = {
      ...tasks[0],
      notes: "Use the new logo from Jo.",
      checklist: [{ id: "c1", text: "Tag Kitsune", done: true }],
    };
    const plan = planRefill(tasks, [workflow], before, after, formats);
    const first = plan.updates.find((update) => update.taskId === "t0");
    expect(first?.changes.notes).toBeUndefined();
    expect(first?.keptParts).toEqual(["notes"]);
    expect(first?.changes.checklist).toEqual([
      { id: "c1", text: "Tag Kitsune Esports", done: true },
    ]);
  });

  it("leaves finished tasks and fully hand-written ones as they are", () => {
    const tasks = made();
    tasks[1] = { ...tasks[1], doneAt: new Date() };
    tasks[2] = {
      ...tasks[2],
      title: "Recap",
      notes: "Mine.",
      checklist: [{ id: "c1", text: "Mine", done: false }],
      posts: [{ ...tasks[2].posts![0], texts: { post: "Mine" } }],
    };
    const plan = planRefill(tasks, [workflow], before, after, formats);
    expect(plan.updates.map((update) => update.taskId)).toEqual(["t0"]);
    expect(plan.kept).toEqual([
      { taskId: "t1", title: tasks[1].title, reason: "done" },
      { taskId: "t2", title: "Recap", reason: "edited" },
    ]);
  });

  it("changes nothing when nothing the tasks use changed", () => {
    const plan = planRefill(
      made(),
      [workflow],
      before,
      { ...before, notes: "New notes" } as typeof before,
      formats,
    );
    expect(plan).toEqual({ updates: [], kept: [] });
  });
});

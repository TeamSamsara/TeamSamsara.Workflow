// File : /TeamSamsara.Workflow/app/src/features/events/model/workflowRefresh.test.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tests bringing an event's tasks in line with its workflows: new
// post text and wording come in, ticks and hand-added checklist items stay,
// finished tasks are skipped, and steps with no task are offered.

import { describe, expect, it } from "vitest";
import type { TaskRecord } from "@/features/tasks";
import { newStep, type WorkflowRecord } from "@/features/workflows";
import { applyWorkflows } from "./applyWorkflows";
import { planWorkflowRefresh, refreshWrite } from "./workflowRefresh";

const formats = {
  timeZone: "America/Toronto",
  clock: "12h",
  dateFormat: "weekdayMonthDay",
} as const;

const event = {
  title: "vs. Orca",
  startsAt: new Date("2026-11-20T22:00:00Z"),
  link: null,
  details: { opponent: "Orca" },
  workflowIds: ["promo"],
};

const old: WorkflowRecord = {
  id: "promo",
  name: "Match day",
  description: "",
  eventTypeId: null,
  archived: false,
  createdAt: null,
  updatedAt: null,
  steps: [
    {
      ...newStep(),
      id: "discord",
      title: "Prep discord post",
      checklist: [{ id: "c1", text: "Draft" }],
      due: { direction: "before", days: 0, hours: 3, minutes: 0, time: null },
    },
  ],
};

function made(workflow: WorkflowRecord): TaskRecord[] {
  return applyWorkflows(event, [workflow], formats).map(
    ({ workflowId, stepId, ...task }) =>
      ({
        ...task,
        id: `match-${stepId}`,
        eventId: "match",
        workflowId,
        stepId,
        doneAt: null,
      }) as TaskRecord,
  );
}

const now: WorkflowRecord = {
  ...old,
  steps: [
    {
      ...old.steps[0],
      checklist: [
        { id: "c1", text: "Draft" },
        { id: "c2", text: "Ping {opponent}" },
      ],
      posts: [
        {
          platformId: "discord",
          formatId: null,
          texts: { post: "vs {opponent}" },
        },
      ],
      due: { direction: "before", days: 1, hours: 0, minutes: 0, time: null },
    },
    { ...newStep(), id: "recap", title: "Recap" },
  ],
};

describe("planWorkflowRefresh", () => {
  it("brings in post text and checklist items, keeping ticks and own items", () => {
    const tasks = made(old).map((task) => ({
      ...task,
      checklist: [
        { id: "c1", text: "Draft", done: true },
        { id: "mine", text: "My extra", done: false },
      ],
    }));
    const plan = planWorkflowRefresh(event, [now], tasks, formats);
    const [update] = plan.updates;
    expect(update.parts).toEqual(["checklist", "posts", "due"]);
    expect(update.changes.posts?.[0].texts.post).toBe("vs Orca");
    expect(update.changes.checklist).toEqual([
      { id: "c1", text: "Draft", done: true },
      { id: "c2", text: "Ping Orca", done: false },
      { id: "mine", text: "My extra", done: false },
    ]);
    expect(refreshWrite(update, false).dueAt).toBeUndefined();
    expect(refreshWrite(update, true).dueAt?.toISOString()).toBe(
      "2026-11-19T22:00:00.000Z",
    );
    expect(plan.newSteps.map((step) => step.stepId)).toEqual(["recap"]);
  });

  it("skips finished tasks and tasks that already match", () => {
    expect(
      planWorkflowRefresh(event, [old], made(old), formats).updates,
    ).toEqual([]);
    const done = made(old).map((task) => ({ ...task, doneAt: new Date() }));
    expect(planWorkflowRefresh(event, [now], done, formats).updates).toEqual(
      [],
    );
  });
});

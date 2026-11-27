// File : /TeamSamsara.Workflow/app/src/features/tasks/model/orderNeighbours.test.ts
// Version : 1.0.0
// Latest commit: feature/1.2-tasks-follow-order
// Author : Gerrah
// Purpose : Tests the tasks shown before and after a task: named and linked
// by the event's tasks the viewer can open, by what it waits on otherwise,
// or by the step's title.

import { describe, expect, it } from "vitest";
import type { TaskRecord } from "../types/taskTypes";
import { orderNeighbours } from "./orderNeighbours";

const steps = [
  { id: "banner", title: "Launch banner", order: [] },
  {
    id: "post",
    title: "Announcement post",
    order: [
      {
        id: "r1",
        relation: "after" as const,
        stepId: "banner",
        condition: "approved" as const,
      },
      {
        id: "r2",
        relation: "before" as const,
        stepId: "recap",
        condition: "done" as const,
      },
    ],
  },
  { id: "recap", title: "{title} recap", order: [] },
];

const task = (stepId: string, extra: Partial<TaskRecord> = {}) =>
  ({
    id: `t-${stepId}`,
    title: steps.find((step) => step.id === stepId)?.title ?? stepId,
    workflowId: "w",
    stepId,
    doneAt: null,
    waitsOn: [],
    waitingOn: [],
    ...extra,
  }) as TaskRecord;

describe("orderNeighbours", () => {
  const post = task("post", {
    waitsOn: [{ stepId: "banner", condition: "approved", dueFrom: false }],
    waitingOn: [
      {
        taskId: "t-banner",
        stepId: "banner",
        title: "Launch banner",
        condition: "approved",
      },
    ],
  });

  it("lists what it comes after and what comes after it", () => {
    const { before, after } = orderNeighbours(post, [post], steps);
    expect(before).toEqual([
      {
        stepId: "banner",
        title: "Launch banner",
        taskId: null,
        done: false,
        condition: "approved",
      },
    ]);
    // Recap can't be opened: its step's title, its field shown by name.
    expect(after).toEqual([
      {
        stepId: "recap",
        title: "[Title] recap",
        taskId: null,
        done: false,
        condition: "done",
      },
    ]);
  });

  it("links the tasks the viewer can open, and says when they're done", () => {
    const banner = task("banner", { doneAt: new Date() });
    const { before } = orderNeighbours(post, [post, banner], steps);
    expect(before[0]).toMatchObject({ taskId: "t-banner", done: true });
  });
});

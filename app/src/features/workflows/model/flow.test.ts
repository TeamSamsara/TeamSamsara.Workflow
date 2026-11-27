// File : /TeamSamsara.Workflow/app/src/features/workflows/model/flow.test.ts
// Version : 1.0.0
// Latest commit: feature/1.2-flow-view
// Author : Gerrah
// Purpose : Tests a workflow as a flow: columns by due time, where the event
// starts, the kinds of link, and linking steps by dragging.

import { describe, expect, it } from "vitest";
import type { DueOffset, WorkflowStep } from "../types/workflowTypes";
import { linkSteps, stepFlow } from "./flow";
import { newStep } from "./workflowDraft";

const due = (
  direction: "before" | "after",
  days: number,
  time: string,
): DueOffset => ({
  direction,
  days,
  hours: 0,
  minutes: 0,
  time,
});
const step = (
  id: string,
  offset: DueOffset,
  order: WorkflowStep["order"] = [],
) => ({
  ...newStep(),
  id,
  title: id,
  due: offset,
  order,
});
const steps: WorkflowStep[] = [
  step("flyers", due("before", 2, "15:00")),
  step("banner", due("before", 1, "12:00")),
  step("post", due("before", 1, "17:00"), [
    { id: "r1", relation: "after", stepId: "banner", condition: "approved" },
    { id: "r2", relation: "after", stepId: "flyers", condition: "order" },
  ]),
  step("photos", due("after", 1, "13:00")),
  step("recap", due("after", 1, "13:00"), [
    { id: "r3", relation: "after", stepId: "photos", condition: "done" },
  ]),
];

describe("stepFlow", () => {
  const flow = stepFlow(steps, "12h");

  it("puts one column per due time, and the event's start before the first after it", () => {
    expect(flow.columns).toHaveLength(4);
    expect(flow.columnOf).toMatchObject({
      flyers: 0,
      banner: 1,
      post: 2,
      photos: 3,
      recap: 3,
    });
    expect(flow.startsBefore).toBe(3);
  });

  it("draws solid, dashed and out-of-order links", () => {
    expect(
      flow.links.map(({ from, to, kind, bad }) => ({ from, to, kind, bad })),
    ).toEqual([
      { from: "banner", to: "post", kind: "hard", bad: false },
      { from: "flyers", to: "post", kind: "soft", bad: false },
      { from: "photos", to: "recap", kind: "hard", bad: true },
    ]);
  });
});

describe("linkSteps", () => {
  it("makes the second step come after the first, once it's done", () => {
    const next = linkSteps(steps, "flyers", "banner");
    expect(next?.find((entry) => entry.id === "banner")?.order).toMatchObject([
      { relation: "after", stepId: "flyers", condition: "done" },
    ]);
  });

  it("won't link steps already linked, or make a loop", () => {
    expect(linkSteps(steps, "banner", "post")).toBeNull();
    expect(linkSteps(steps, "post", "banner")).toBeNull();
    expect(linkSteps(steps, "recap", "photos")).toBeNull();
    expect(linkSteps(steps, "post", "post")).toBeNull();
  });
});

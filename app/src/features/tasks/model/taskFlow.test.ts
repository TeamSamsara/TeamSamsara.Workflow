// File : /TeamSamsara.Workflow/app/src/features/tasks/model/taskFlow.test.ts
// Version : 1.0.0
// Latest commit: feature/1.2-flow-view
// Author : Gerrah
// Purpose : Tests for an event's tasks as a flow: columns by due time, the
// event's start, and the links from what each task waits on.

import { describe, expect, it } from "vitest";
import { taskFlow, type TaskFlowTask } from "./taskFlow";

const at = (hour: number) => new Date(Date.UTC(2026, 10, 17, hour));
const task = (
  id: string,
  dueAt: Date | null,
  waitsOn: TaskFlowTask["waitsOn"] = [],
  workflowId: string | null = "w1",
): TaskFlowTask => ({ id, workflowId, stepId: `s-${id}`, dueAt, waitsOn });

describe("taskFlow", () => {
  it("puts tasks in columns by due time, no due time last", () => {
    const flow = taskFlow(
      [task("b", at(15)), task("a", at(9)), task("c", null), task("d", at(9))],
      at(12),
    );
    expect(flow.columns).toEqual([at(9), at(15), null]);
    expect(flow.columnOf).toEqual({ a: 0, d: 0, b: 1, c: 2 });
    expect(flow.startsBefore).toBe(1);
  });

  it("has no start marker when every task is before the event", () => {
    expect(taskFlow([task("a", at(9))], at(12)).startsBefore).toBeNull();
  });

  it("links a task to the one it waits on, in the same workflow", () => {
    const flow = taskFlow(
      [
        task("a", at(9)),
        task("b", at(10), [{ stepId: "s-a", condition: "done" }]),
        task("c", at(11), [{ stepId: "s-b", condition: "order" }]),
        task("x", at(11), [{ stepId: "s-a", condition: "done" }], "w2"),
      ],
      at(8),
    );
    expect(flow.links).toEqual([
      { id: "a>b", from: "a", to: "b", kind: "hard" },
      { id: "b>c", from: "b", to: "c", kind: "soft" },
    ]);
  });
});

// File : /TeamSamsara.Workflow/engine/src/order.test.ts
// Version : 1.0.0
// Latest commit: feature/1.2-tasks-follow-order
// Author : Gerrah
// Purpose : Tests the order between tasks: what each step waits on, when a
// task is locked (all or any, late, started anyway), what a change unlocks,
// and Due from times. Uses the Product launch workflow from the designs.

// describe, it and expect come from Vitest's globals (see app/vitest.config.ts).
import {
  conditionMet,
  freshTask,
  waitingOnAtCreation,
  waitingOnOf,
  dueFromDone,
  unlockedBy,
  waitsOf,
  waitState,
  type OrderRule,
  type StepForOrder,
  type TaskForOrder,
  type WaitingTask,
} from "./order.js";
import { applyWorkflows, type StepForTasks } from "./tasks.js";

const rule = (
  stepId: string,
  relation: OrderRule["relation"] = "after",
  condition: OrderRule["condition"] = "done",
): OrderRule => ({ id: `r-${stepId}`, relation, stepId, condition });

// 1 flyers, 2 banner (approval), 3 post after banner approved and after
// flyers (only the order), and before recap; 5 recap after 4 photos.
const steps: StepForOrder[] = [
  { id: "flyers", order: [] },
  { id: "banner", order: [] },
  {
    id: "post",
    order: [
      rule("banner", "after", "approved"),
      rule("flyers", "after", "order"),
      rule("recap", "before", "done"),
    ],
  },
  { id: "photos", order: [] },
  { id: "recap", order: [rule("photos")] },
];

type Task = TaskForOrder & WaitingTask;
const task = (stepId: string, extra: Partial<Task> = {}): Task => ({
  id: stepId,
  title: stepId,
  workflowId: "launch",
  stepId,
  doneAt: null,
  approvedAt: null,
  sentForReviewAt: null,
  liveLink: null,
  waitsOn: waitsOf(steps, stepId),
  waitFor: "all",
  whenLate: "wait",
  dueAt: new Date("2026-12-01T17:00:00Z"),
  startedAnyway: null,
  ...extra,
});
const now = new Date("2026-11-30T12:00:00Z");
const done = new Date("2026-11-29T12:00:00Z");

describe("waitsOf", () => {
  it("lists the steps a step comes after, from rules on either side", () => {
    expect(waitsOf(steps, "post")).toEqual([
      { stepId: "banner", condition: "approved", dueFrom: false },
      { stepId: "flyers", condition: "order", dueFrom: false },
    ]);
    expect(waitsOf(steps, "recap").map((wait) => wait.stepId)).toEqual([
      "post",
      "photos",
    ]);
    expect(waitsOf(steps, "flyers")).toEqual([]);
  });

  it("marks a Due from wait", () => {
    const due = [
      { id: "a", order: [] },
      { id: "b", order: [rule("a", "dueFrom")] },
    ];
    expect(waitsOf(due, "b")).toEqual([
      { stepId: "a", condition: "done", dueFrom: true },
    ]);
  });
});

describe("conditionMet", () => {
  it("reads each condition from the task", () => {
    const sent = task("banner", { sentForReviewAt: done });
    expect(conditionMet("inReview", sent)).toBe(true);
    expect(conditionMet("approved", sent)).toBe(false);
    expect(conditionMet("approved", { ...sent, approvedAt: done })).toBe(true);
    expect(conditionMet("liveLink", { ...sent, liveLink: " " })).toBe(false);
    expect(conditionMet("order", sent)).toBe(true);
  });
});

describe("waitState", () => {
  const all = ["flyers", "banner", "post", "photos", "recap"].map((id) =>
    task(id),
  );

  it("locks a task until what it waits on happens; only the order never locks", () => {
    const state = waitState(task("post"), all, now);
    expect(state.locked).toBe(true);
    expect(state.waitingOn).toEqual([
      {
        taskId: "banner",
        stepId: "banner",
        title: "banner",
        condition: "approved",
      },
    ]);
    const approved = all.map((other) =>
      other.id === "banner" ? { ...other, approvedAt: done } : other,
    );
    expect(waitState(task("post"), approved, now).locked).toBe(false);
  });

  it("waits for all of them, or any one", () => {
    const photosDone = all.map((other) =>
      other.id === "photos" ? { ...other, doneAt: done } : other,
    );
    expect(waitState(task("recap"), photosDone, now).locked).toBe(true);
    expect(
      waitState(task("recap", { waitFor: "any" }), photosDone, now).locked,
    ).toBe(false);
  });

  it("unlocks a late task set to, and one started anyway", () => {
    const late = task("post", {
      whenLate: "unlock",
      dueAt: new Date("2026-11-30T11:00:00Z"),
    });
    expect(waitState(late, all, now)).toMatchObject({
      locked: false,
      unlockedLate: true,
    });
    const started = task("post", {
      startedAnyway: { by: "sam", at: now, reason: "Banner is late" },
    });
    expect(waitState(started, all, now).locked).toBe(false);
    expect(waitState(started, all, now).waitingOn).toHaveLength(1);
  });

  it("isn't held by a task that's gone, and never locks a finished task", () => {
    expect(waitState(task("post"), [task("post")], now).locked).toBe(false);
    expect(waitState(task("post", { doneAt: done }), all, now).locked).toBe(
      false,
    );
  });
});

describe("unlockedBy", () => {
  it("finds the tasks a change unlocks", () => {
    const all = ["flyers", "banner", "post", "photos", "recap"].map((id) =>
      task(id),
    );
    const before = all[1];
    const after = { ...before, sentForReviewAt: done, approvedAt: done };
    expect(unlockedBy(before, after, all, now).map((t) => t.id)).toEqual([
      "post",
    ]);
    // Done photos alone don't unlock recap: it waits for post too.
    expect(unlockedBy(all[3], { ...all[3], doneAt: done }, all, now)).toEqual(
      [],
    );
  });
});

describe("tasks made from steps", () => {
  it("carry their priority, what they wait on and their Due from offset", () => {
    const step = (
      id: string,
      extra: Partial<StepForTasks> = {},
    ): StepForTasks => ({
      id,
      title: id,
      notes: "",
      workGroupId: null,
      memberId: null,
      due: { direction: "after", days: 1, hours: 0, minutes: 0, time: "13:00" },
      needsApproval: false,
      tagIds: [],
      posts: null,
      checklist: null,
      links: null,
      asksForLiveLink: false,
      ...extra,
    });
    const [first, second] = applyWorkflows(
      {
        title: "Launch",
        startsAt: new Date("2026-12-01T17:00:00Z"),
        link: null,
        details: {},
      },
      [
        {
          id: "w",
          steps: [
            step("a", { priority: "high" }),
            step("b", { order: [rule("a", "dueFrom")], waitFor: "any" }),
          ],
        },
      ],
      {
        timeZone: "America/Toronto",
        clock: "12h",
        dateFormat: "weekdayMonthDay",
      },
    );
    expect(first).toMatchObject({
      priority: "high",
      waitsOn: [],
      dueFromOffset: null,
    });
    expect(second).toMatchObject({
      priority: "normal",
      waitFor: "any",
      waitsOn: [{ stepId: "a", condition: "done", dueFrom: true }],
    });
    expect(second.dueFromOffset).toMatchObject({ days: 1, time: "13:00" });
  });
});

describe("dueFromDone", () => {
  it("counts the offset forward from when the task was done", () => {
    // Done Tue Dec 1 at 3:00 PM in Toronto; due the day after at 1:00 PM.
    const due = dueFromDone(
      new Date("2026-12-01T20:00:00Z"),
      { direction: "before", days: 1, hours: 0, minutes: 0, time: "13:00" },
      "America/Toronto",
    );
    expect(due.toISOString()).toBe("2026-12-02T18:00:00.000Z");
  });
});

describe("waitingOnOf and waitingOnAtCreation", () => {
  it("empties once a task waiting for any one is free, so the rules can check the task alone", () => {
    const all = ["flyers", "banner", "post", "photos", "recap"].map((id) =>
      task(id),
    );
    const any = task("recap", { waitFor: "any" });
    expect(waitingOnOf(any, all).map((wait) => wait.stepId)).toEqual([
      "post",
      "photos",
    ]);
    const photosDone = all.map((other) =>
      other.id === "photos" ? { ...other, doneAt: done } : other,
    );
    expect(waitingOnOf(any, photosDone)).toEqual([]);
    expect(waitingOnOf(task("recap"), photosDone).map((w) => w.stepId)).toEqual(
      ["post"],
    );
  });

  it("works out what a new task waits on from the tasks made with it", () => {
    const others = [
      freshTask("e_launch_banner", {
        title: "Launch banner",
        workflowId: "launch",
        stepId: "banner",
      }),
    ];
    expect(
      waitingOnAtCreation(
        {
          id: "e_launch_post",
          workflowId: "launch",
          waitsOn: waitsOf(steps, "post"),
          waitFor: "all",
        },
        others,
      ),
    ).toEqual([
      {
        taskId: "e_launch_banner",
        stepId: "banner",
        title: "Launch banner",
        condition: "approved",
      },
    ]);
  });
});

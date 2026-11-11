// File : /TeamSamsara.Workflow/app/src/features/events/model/workflowSync.test.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tests which tasks follow a saved workflow: untouched pieces move
// to the new version, pieces changed by hand stay, finished tasks and removed
// steps are left alone, and a due time that has already passed is set apart.

import { describe, expect, it } from "vitest";
import type { TaskRecord } from "@/features/tasks";
import { newStep, type WorkflowRecord } from "@/features/workflows";
import { applyWorkflows } from "./applyWorkflows";
import {
  changesToWrite,
  hasSyncWork,
  planWorkflowSync,
  type SyncEvent,
} from "./workflowSync";

const formats = {
  timeZone: "America/Toronto",
  clock: "12h",
  dateFormat: "weekdayMonthDay",
} as const;

// Fri Nov 20, 2026 at 5:00 PM in Toronto.
const event: SyncEvent = {
  id: "match",
  title: "vs. Orca",
  startsAt: new Date("2026-11-20T22:00:00Z"),
  link: null,
  details: { opponent: "Orca" },
};

const now = new Date("2026-11-11T17:00:00Z");

const before: WorkflowRecord = {
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
      id: "caption",
      title: "Prep caption vs {opponent}",
      notes: "Tag {opponent}.",
      due: { direction: "before", days: 0, hours: 3, minutes: 0, time: null },
      checklist: [{ id: "c1", text: "Draft" }],
    },
    {
      ...newStep(),
      id: "recap",
      title: "Recap",
      due: { direction: "after", days: 0, hours: 2, minutes: 0, time: null },
    },
  ],
};

function made(workflow = before, forEvent: SyncEvent = event): TaskRecord[] {
  return applyWorkflows(forEvent, [workflow], formats).map(
    ({ workflowId, stepId, ...task }) => ({
      ...task,
      id: `${forEvent.id}-${stepId}`,
      statusId: "todo",
      liveLink: null,
      eventId: forEvent.id,
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
      lateAtCreation: false,
      doneBy: null,
      eventGone: null,
    }),
  );
}

function withCaption(change: Partial<WorkflowRecord["steps"][number]>) {
  return {
    ...before,
    steps: before.steps.map((step) =>
      step.id === "caption" ? { ...step, ...change } : step,
    ),
  };
}

const twoDaysBefore = {
  direction: "before",
  days: 2,
  hours: 0,
  minutes: 0,
  time: "23:30",
} as const;

describe("planWorkflowSync", () => {
  it("moves an untouched task to the new due time", () => {
    const after = withCaption({ due: twoDaysBefore });
    const plan = planWorkflowSync(before, after, made(), [event], formats, now);
    expect(plan.update).toHaveLength(1);
    const [update] = plan.update;
    expect(update.taskId).toBe("match-caption");
    expect(update.parts).toEqual(["due"]);
    // Wed Nov 18 at 11:30 PM in Toronto.
    expect(update.toDue?.toISOString()).toBe("2026-11-19T04:30:00.000Z");
    expect(update.fromDue?.toISOString()).toBe("2026-11-20T19:00:00.000Z");
    expect(plan.leftAlone).toEqual([]);
  });

  it("fills the new text from the event, keeping checklist ticks", () => {
    const after = withCaption({
      title: "Caption for {opponent}",
      checklist: [
        { id: "c1", text: "Draft" },
        { id: "c2", text: "Send to {opponent}" },
      ],
    });
    const tasks = made();
    tasks[0] = {
      ...tasks[0],
      checklist: [{ id: "c1", text: "Draft", done: true }],
    };
    const plan = planWorkflowSync(before, after, tasks, [event], formats, now);
    const [update] = plan.update;
    expect(update.changes.title).toBe("Caption for Orca");
    expect(update.changes.checklist).toEqual([
      { id: "c1", text: "Draft", done: true },
      { id: "c2", text: "Send to Orca", done: false },
    ]);
  });

  it("leaves a due time changed by hand, but still updates the text", () => {
    const after = withCaption({ due: twoDaysBefore, notes: "Tag {opponent}!" });
    const tasks = made();
    tasks[0] = { ...tasks[0], dueAt: new Date("2026-11-20T15:00:00Z") };
    const plan = planWorkflowSync(before, after, tasks, [event], formats, now);
    const [update] = plan.update;
    expect(update.parts).toEqual(["notes"]);
    expect(update.keptParts).toEqual(["due"]);
    expect(update.changes.dueAt).toBeUndefined();
  });

  it("lists a task changed by hand everywhere it would change as left alone", () => {
    const after = withCaption({ due: twoDaysBefore });
    const tasks = made();
    tasks[0] = { ...tasks[0], dueAt: new Date("2026-11-20T15:00:00Z") };
    const plan = planWorkflowSync(before, after, tasks, [event], formats, now);
    expect(plan.update).toEqual([]);
    expect(plan.leftAlone).toEqual([
      {
        taskId: "match-caption",
        eventTitle: "vs. Orca",
        title: "Prep caption vs Orca",
        reason: "edited",
        parts: ["due"],
      },
    ]);
  });

  it("leaves finished tasks and removed steps alone", () => {
    const after = {
      ...withCaption({ due: twoDaysBefore }),
      steps: [{ ...before.steps[0], due: twoDaysBefore }],
    };
    const tasks = made();
    tasks[0] = { ...tasks[0], doneAt: now };
    const plan = planWorkflowSync(before, after, tasks, [event], formats, now);
    expect(plan.update).toEqual([]);
    expect(plan.leftAlone.map((task) => task.reason).sort()).toEqual([
      "done",
      "stepRemoved",
    ]);
  });

  it("sets apart a task whose new due time has already passed", () => {
    // Tomorrow at 5 PM: two days before is yesterday.
    const soon: SyncEvent = {
      ...event,
      id: "soon",
      title: "vs. Kitsune",
      startsAt: new Date("2026-11-12T22:00:00Z"),
    };
    const after = withCaption({ due: twoDaysBefore });
    const plan = planWorkflowSync(
      before,
      after,
      [...made(before, soon), ...made()],
      [soon, event],
      formats,
      now,
    );
    expect(plan.update.map((update) => update.eventId)).toEqual(["match"]);
    expect(plan.alreadyLate.map((update) => update.eventId)).toEqual(["soon"]);
    const late = plan.alreadyLate[0];
    expect(changesToWrite(late, false)).toEqual({});
    expect(changesToWrite(late, true).dueAt).toEqual(late.toDue);
  });

  it("skips past events, other workflows' tasks and unchanged steps", () => {
    const past: SyncEvent = {
      ...event,
      id: "past",
      startsAt: new Date("2026-11-01T22:00:00Z"),
    };
    const after = withCaption({ due: twoDaysBefore });
    const other = made().map((task) => ({ ...task, workflowId: "other" }));
    const plan = planWorkflowSync(
      before,
      after,
      [...made(before, past), ...other],
      [past, event],
      formats,
      now,
    );
    expect(hasSyncWork(plan)).toBe(false);
    expect(
      hasSyncWork(
        planWorkflowSync(before, before, made(), [event], formats, now),
      ),
    ).toBe(false);
  });
});

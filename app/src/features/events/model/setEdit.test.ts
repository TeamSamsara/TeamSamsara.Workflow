// File : /TeamSamsara.Workflow/app/src/features/events/model/setEdit.test.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tests filling in a set's fields: titles that follow the pattern
// fill again (or take a new pattern), custom titles stay, tasks' text follows
// unless it was changed by hand, and events it doesn't change are left out.

import { describe, expect, it } from "vitest";
import type { TaskRecord } from "@/features/tasks";
import { newStep, type WorkflowRecord } from "@/features/workflows";
import type { EventRecord } from "../types/eventTypes";
import { applyWorkflows } from "./applyWorkflows";
import { planEventEdit, planSetEdit, sharedValue } from "./setEdit";

const formats = {
  timeZone: "America/Toronto",
  clock: "12h",
  dateFormat: "weekdayMonthDay",
} as const;

const workflow: WorkflowRecord = {
  id: "promo",
  name: "Match day",
  description: "",
  eventTypeId: null,
  archived: false,
  createdAt: null,
  updatedAt: null,
  steps: [{ ...newStep(), id: "post", title: "Post vs {opponent}" }],
};

function event(id: string, title: string, opponent?: string): EventRecord {
  return {
    id,
    title,
    startsAt: new Date("2026-11-20T22:00:00Z"),
    endsAt: new Date("2026-11-20T23:00:00Z"),
    link: null,
    details: opponent ? { opponent } : {},
  } as EventRecord;
}

function tasksOf(match: EventRecord): TaskRecord[] {
  return applyWorkflows(match, [workflow], formats).map(
    ({ workflowId, stepId, ...task }) =>
      ({
        ...task,
        id: `${match.id}-${stepId}`,
        eventId: match.id,
        workflowId,
        stepId,
        doneAt: null,
      }) as TaskRecord,
  );
}

const pattern = "vs. {opponent}";

describe("planEventEdit", () => {
  it("fills a TBD title and its tasks", () => {
    const match = event("a", "vs. {opponent}");
    const edit = planEventEdit(
      match,
      { details: { opponent: "Orca" }, pattern },
      tasksOf(match),
      [workflow],
      formats,
    );
    expect(edit?.title).toBe("vs. Orca");
    expect(edit?.details).toEqual({ opponent: "Orca" });
    expect(edit?.refills.map((refill) => refill.changes.title)).toEqual([
      "Post vs Orca",
    ]);
  });

  it("keeps a custom title and task text changed by hand", () => {
    const match = event("a", "Finals!", "Orca");
    const tasks = tasksOf(match).map((task) => ({
      ...task,
      title: "My own title",
    }));
    const edit = planEventEdit(
      match,
      { details: { opponent: "Kitsune" }, pattern },
      tasks,
      [workflow],
      formats,
    );
    expect(edit?.title).toBe("Finals!");
    expect(edit?.refills).toEqual([]);
  });

  it("follows a new pattern and leaves unchanged events out", () => {
    const events = [event("a", "vs. Orca", "Orca"), event("b", "Custom", "X")];
    const tasks = events.flatMap(tasksOf);
    const edits = planSetEdit(
      events,
      { details: {}, pattern, newPattern: "Week 3 vs. {opponent}" },
      tasks,
      [workflow],
      formats,
    );
    expect(edits.map((edit) => [edit.eventId, edit.title])).toEqual([
      ["a", "Week 3 vs. Orca"],
    ]);
    expect(
      planSetEdit(events, { details: {}, pattern }, tasks, [workflow], formats),
    ).toEqual([]);
  });

  it("finds a value every event shares", () => {
    const events = [event("a", "x", "Orca"), event("b", "y", "Orca")];
    expect(sharedValue(events, "opponent")).toBe("Orca");
    expect(sharedValue([...events, event("c", "z")], "opponent")).toBeNull();
  });
});

// File : /TeamSamsara.Workflow/app/src/features/tasks/model/flowOrder.test.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tests that tasks follow their workflow's order before due time,
// stay together per event, and that hand-made tasks come after.

import { describe, expect, it } from "vitest";
import { flowRank, noFlow, sortByFlow, type FlowTask } from "./flowOrder";

const workflows = [
  { id: "promo", name: "Promo", steps: [{ id: "graphic" }, { id: "caption" }] },
  { id: "recap", name: "Recap", steps: [{ id: "clip" }] },
];

const at = (iso: string) => new Date(iso);

function task(
  id: string,
  eventId: string | null,
  workflowId: string | null,
  stepId: string | null,
  dueAt: Date | null,
): FlowTask {
  return { id, eventId, workflowId, stepId, dueAt };
}

describe("sortByFlow", () => {
  const rank = flowRank(workflows, (id) =>
    id === "a" ? ["recap", "promo"] : undefined,
  );

  it("puts step order before due time within an event", () => {
    const tasks = [
      task("caption", "b", "promo", "caption", at("2026-11-20T10:00:00Z")),
      task("graphic", "b", "promo", "graphic", at("2026-11-20T12:00:00Z")),
    ];
    expect(sortByFlow(tasks, rank).map((t) => t.id)).toEqual([
      "graphic",
      "caption",
    ]);
  });

  it("follows the event's workflow order, then hand-made tasks", () => {
    const tasks = [
      task("extra", "a", null, null, at("2026-11-19T10:00:00Z")),
      task("graphic", "a", "promo", "graphic", at("2026-11-20T10:00:00Z")),
      task("clip", "a", "recap", "clip", at("2026-11-21T10:00:00Z")),
    ];
    expect(sortByFlow(tasks, rank).map((t) => t.id)).toEqual([
      "clip",
      "graphic",
      "extra",
    ]);
  });

  it("keeps each event together and orders events by their first due", () => {
    const tasks = [
      task("b-caption", "b", "promo", "caption", at("2026-11-22T10:00:00Z")),
      task("lone", null, null, null, at("2026-11-21T12:00:00Z")),
      task("c-graphic", "c", "promo", "graphic", at("2026-11-21T10:00:00Z")),
      task("b-graphic", "b", "promo", "graphic", at("2026-11-23T10:00:00Z")),
      task("c-caption", "c", "promo", "caption", at("2026-11-21T09:00:00Z")),
    ];
    expect(sortByFlow(tasks, rank).map((t) => t.id)).toEqual([
      "c-graphic",
      "c-caption",
      "lone",
      "b-graphic",
      "b-caption",
    ]);
  });

  it("falls back to due time for removed steps or no workflows", () => {
    const tasks = [
      task("gone", "b", "promo", "deleted", at("2026-11-20T09:00:00Z")),
      task("graphic", "b", "promo", "graphic", at("2026-11-20T12:00:00Z")),
    ];
    expect(sortByFlow(tasks, rank).map((t) => t.id)).toEqual([
      "graphic",
      "gone",
    ]);
    expect(sortByFlow(tasks, noFlow).map((t) => t.id)).toEqual([
      "gone",
      "graphic",
    ]);
  });
});

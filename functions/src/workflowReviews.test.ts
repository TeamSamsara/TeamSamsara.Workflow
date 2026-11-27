// File : /TeamSamsara.Workflow/functions/src/workflowReviews.test.ts
// Version : 1.0.0
// Latest commit: feature/1.2-after-saving
// Author : Gerrah
// Purpose : Tests for what a workflow save writes down for whoever saved it,
// and which tasks a write asks to move.

import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";
import { newlyAsked, readReviewTasks, reviewDoc } from "./workflowReviews.js";

const differs = (taskId: string, hour: number) => ({
  taskId,
  title: `Task ${taskId}`,
  eventId: "e1",
  eventTitle: "Launch",
  from: new Date(Date.UTC(2026, 10, 17, hour)),
  to: new Date(Date.UTC(2026, 10, 17, hour + 2)),
  edited: false,
});

describe("reviewDoc", () => {
  it("writes the tasks earliest due first, with nothing moved yet", () => {
    const doc = reviewDoc("w1", "Launch", "m1", [
      differs("b", 15),
      differs("a", 9),
    ]);
    expect(doc.tasks.map((task: { taskId: string }) => task.taskId)).toEqual([
      "a",
      "b",
    ]);
    expect(doc.tasks[0].to).toEqual(
      Timestamp.fromDate(new Date(Date.UTC(2026, 10, 17, 11))),
    );
    expect(doc).toMatchObject({ total: 2, move: [], moved: [], left: false });
  });
});

describe("newlyAsked", () => {
  const base = reviewDoc("w1", "Launch", "m1", [
    differs("a", 9),
    differs("b", 10),
    differs("c", 11),
  ]);

  it("reads the tasks back", () => {
    expect(readReviewTasks(base)[1].from?.getUTCHours()).toBe(10);
  });

  it("is the tasks added to move in this write", () => {
    const asked = newlyAsked(
      { ...base, move: ["a"] },
      { ...base, move: ["a", "c"], moved: ["a"] },
    );
    expect(asked.map((task) => task.taskId)).toEqual(["c"]);
  });

  it("ignores ids that weren't written down, and ones already handled", () => {
    const asked = newlyAsked(base, {
      ...base,
      move: ["x", "b"],
      skipped: ["b"],
    });
    expect(asked).toEqual([]);
  });
});

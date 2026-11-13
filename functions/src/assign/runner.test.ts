// File : /TeamSamsara.Workflow/functions/src/assign/runner.test.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Tests which task changes make a group hand out again, and reading
// someone's usual week as it's stored.

import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";
import { readWeek, touchesQueue } from "./runner.js";

const due = Timestamp.fromDate(new Date("2026-11-14T20:00:00Z"));
const queued = {
  workGroupId: "design",
  memberId: null,
  doneAt: null,
  dueAt: due,
};

describe("touchesQueue", () => {
  it("runs the group for a task that starts waiting", () => {
    expect(touchesQueue(undefined, queued)).toEqual(["design"]);
    expect(touchesQueue({ ...queued, memberId: "sam" }, queued)).toEqual([
      "design",
    ]);
  });

  it("runs it again when a waiting task's due time moves", () => {
    const moved = {
      ...queued,
      dueAt: Timestamp.fromDate(new Date("2026-11-15T20:00:00Z")),
    };
    expect(touchesQueue(queued, moved)).toEqual(["design"]);
    expect(touchesQueue(queued, { ...queued, title: "New name" })).toEqual([]);
  });

  it("runs it when someone has room again", () => {
    const theirs = { ...queued, memberId: "sam" };
    expect(touchesQueue(theirs, { ...theirs, doneAt: due })).toEqual([
      "design",
    ]);
    expect(touchesQueue(theirs, undefined)).toEqual(["design"]);
    expect(touchesQueue(theirs, { ...theirs, title: "New name" })).toEqual([]);
  });

  it("leaves tasks the hand-out just gave", () => {
    expect(touchesQueue(queued, { ...queued, memberId: "sam" })).toEqual([]);
  });
});

describe("readWeek", () => {
  it("reads weekdays stored as text keys and drops bad entries", () => {
    expect(
      readWeek({
        weekly: { "6": [18, 19, "x"], "9": [1] },
        exceptions: [
          { date: "2026-11-14", from: "19:00", to: "20:00", available: true },
          null,
        ],
        timeZone: "Europe/Paris",
      }),
    ).toEqual({
      weekly: { 6: [18, 19] },
      exceptions: [
        { date: "2026-11-14", from: "19:00", to: "20:00", available: true },
      ],
      timeZone: "Europe/Paris",
    });
    expect(readWeek(undefined)).toBeNull();
  });
});

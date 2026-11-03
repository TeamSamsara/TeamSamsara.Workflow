// File : /TeamSamsara.Workflow/app/src/features/tasks/model/taskStatusFlow.test.ts
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : Tests what can happen next to a task with the starting statuses
// (To do, In review, Approved, Done, Skipped) and with renamed or missing ones.

import { describe, expect, it } from "vitest";
import type { StatusRecord } from "@/core/data";
import { missingReviewStatus, nextActions } from "./taskStatusFlow";

const statuses: StatusRecord[] = [
  { id: "todo", name: "To do", tone: "neutral", category: "open", position: 0 },
  {
    id: "review",
    name: "In review",
    tone: "info",
    category: "awaitingApproval",
    position: 1,
  },
  {
    id: "approved",
    name: "Approved",
    tone: "alert",
    category: "open",
    position: 2,
  },
  {
    id: "done",
    name: "Done",
    tone: "success",
    category: "finished",
    position: 3,
  },
  {
    id: "skipped",
    name: "Skipped",
    tone: "muted",
    category: "closed",
    position: 4,
  },
];

const task = {
  statusId: "todo",
  needsApproval: false,
  approvedAt: null as Date | null,
  asksForLiveLink: false,
  liveLink: null as string | null,
};
const worker = { canWork: true, canApprove: false };
const approver = { canWork: false, canApprove: true };

describe("nextActions", () => {
  it("lets the person doing it mark it done", () => {
    expect(nextActions(task, statuses, worker)).toEqual([
      { kind: "markDone", statusId: "done", blockedBy: null },
    ]);
  });

  it("asks for the published link first when the task wants one", () => {
    expect(
      nextActions({ ...task, asksForLiveLink: true }, statuses, worker),
    ).toEqual([
      { kind: "markDone", statusId: "done", blockedBy: "needsLiveLink" },
    ]);
    expect(
      nextActions(
        { ...task, asksForLiveLink: true, liveLink: "https://x.com/p/1" },
        statuses,
        worker,
      ),
    ).toEqual([{ kind: "markDone", statusId: "done", blockedBy: null }]);
  });

  it("sends a task that needs approval for review instead", () => {
    expect(
      nextActions({ ...task, needsApproval: true }, statuses, worker),
    ).toEqual([{ kind: "sendForReview", statusId: "review" }]);
  });

  it("lets an approver approve it on to the next step, or ask for changes", () => {
    const inReview = { ...task, needsApproval: true, statusId: "review" };
    expect(nextActions(inReview, statuses, approver)).toEqual([
      { kind: "approve", statusId: "approved" },
      { kind: "askForChanges", statusId: "todo" },
    ]);
    expect(nextActions(inReview, statuses, worker)).toEqual([]);
  });

  it("lets it be done once approved", () => {
    const approved = {
      ...task,
      needsApproval: true,
      statusId: "approved",
      approvedAt: new Date(),
    };
    expect(nextActions(approved, statuses, worker)).toEqual([
      { kind: "markDone", statusId: "done", blockedBy: null },
    ]);
  });

  it("reopens a done or skipped task", () => {
    expect(
      nextActions({ ...task, statusId: "done" }, statuses, worker),
    ).toEqual([{ kind: "reopen", statusId: "todo" }]);
    expect(
      nextActions({ ...task, statusId: "skipped" }, statuses, worker),
    ).toEqual([{ kind: "reopen", statusId: "todo" }]);
  });

  it("offers nothing to someone who can't work on it or approve it", () => {
    const viewer = { canWork: false, canApprove: false };
    expect(nextActions(task, statuses, viewer)).toEqual([]);
  });

  it("approves straight to done when nothing comes between", () => {
    const short = statuses.filter((status) => status.id !== "approved");
    const inReview = { ...task, needsApproval: true, statusId: "review" };
    expect(nextActions(inReview, short, approver)[0]).toEqual({
      kind: "approve",
      statusId: "done",
    });
  });
});

describe("missingReviewStatus", () => {
  it("spots a task needing approval with no status to wait in", () => {
    const noReview = statuses.filter(
      (status) => status.category !== "awaitingApproval",
    );
    expect(
      missingReviewStatus({ ...task, needsApproval: true }, noReview),
    ).toBe(true);
    expect(
      missingReviewStatus({ ...task, needsApproval: true }, statuses),
    ).toBe(false);
    expect(
      nextActions({ ...task, needsApproval: true }, noReview, worker),
    ).toEqual([]);
  });
});

// File : /TeamSamsara.Workflow/app/src/features/task-setup/service/statusRules.test.ts
// Version : 1.0.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : Tests that the status list always keeps an open and a finished
// status, and where new tasks start.

import { describe, expect, it } from "vitest";
import type { StatusCategory, StatusRecord } from "@/core/data";
import {
  categoryChangeBlocker,
  deleteStatusBlocker,
  startingStatus,
} from "./statusRules";

const status = (
  id: string,
  category: StatusCategory,
  position: number,
): StatusRecord => ({ id, name: id, tone: "neutral", category, position });

const statuses = [
  status("review", "awaitingApproval", 1),
  status("todo", "open", 0),
  status("approved", "open", 2),
  status("done", "finished", 3),
  status("skipped", "closed", 4),
];

describe("deleteStatusBlocker", () => {
  it("lets a status go while another of its kind is left", () => {
    expect(deleteStatusBlocker(statuses, "todo")).toBeNull();
    expect(deleteStatusBlocker(statuses, "review")).toBeNull();
    expect(deleteStatusBlocker(statuses, "skipped")).toBeNull();
  });

  it("keeps the last open and the last finished status", () => {
    expect(deleteStatusBlocker(statuses, "done")).toBe("finished");
    const oneOpen = statuses.filter((item) => item.id !== "approved");
    expect(deleteStatusBlocker(oneOpen, "todo")).toBe("open");
  });
});

describe("categoryChangeBlocker", () => {
  it("refuses to turn the last finished status into something else", () => {
    expect(categoryChangeBlocker(statuses, "done", "closed")).toBe("finished");
    expect(categoryChangeBlocker(statuses, "done", "finished")).toBeNull();
    expect(categoryChangeBlocker(statuses, "todo", "finished")).toBeNull();
  });
});

describe("startingStatus", () => {
  it("is the first open status in order", () => {
    expect(startingStatus(statuses)?.id).toBe("todo");
    expect(startingStatus([status("done", "finished", 0)])).toBeUndefined();
  });
});

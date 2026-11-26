// File : /TeamSamsara.Workflow/functions/src/access/reviewers.test.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Tests who is asked to approve: leads of the task's group first,
// then approvers, then Administrators, never the person who did it, and only
// people at or above them.

import { describe, expect, it } from "vitest";
import type { RoleForAccess } from "../../../engine/src/index.js";
import { reviewersFor, type ReviewerCandidate } from "./reviewers.js";

const roles: RoleForAccess[] = [
  { id: "everyone", position: 0, permissions: ["doAssignedTasks"] },
  { id: "contributor", position: 10, permissions: [] },
  { id: "approver", position: 20, permissions: ["approveTasks"] },
  { id: "admin", position: 40, permissions: ["administrator"] },
];

const person = (
  id: string,
  roleIds: string[],
  rank: number,
  extra: Partial<ReviewerCandidate> = {},
): ReviewerCandidate => ({
  id,
  status: "active",
  roleIds,
  workGroupIds: [],
  leadOf: [],
  rank,
  ...extra,
});

const people = [
  person("lena", ["contributor"], 10, {
    workGroupIds: ["design"],
    leadOf: ["design"],
  }),
  person("dev", ["contributor"], 10, { workGroupIds: ["design"] }),
  person("rae", ["approver"], 20),
  person("ada", ["admin"], 40),
];

describe("reviewersFor", () => {
  it("asks the group's leads first", () => {
    expect(
      reviewersFor(
        { memberId: "dev", workGroupId: "design", sentForReviewBy: "dev" },
        people,
        roles,
      ),
    ).toEqual(["lena"]);
  });

  it("skips a lead who did the task, and asks approvers", () => {
    expect(
      reviewersFor(
        { memberId: "lena", workGroupId: "design", sentForReviewBy: "lena" },
        people,
        roles,
      ),
    ).toEqual(["rae", "ada"]);
  });

  it("skips approvers below the doer, and falls back to Administrators", () => {
    const boss = person("boss", ["admin"], 30);
    expect(
      reviewersFor(
        { memberId: "boss", workGroupId: null, sentForReviewBy: "boss" },
        [...people, boss],
        roles,
      ),
    ).toEqual(["ada"]);
  });

  it("never asks the doer, even an Administrator", () => {
    expect(
      reviewersFor(
        { memberId: "ada", workGroupId: null, sentForReviewBy: "ada" },
        people,
        roles,
      ),
    ).toEqual([]);
  });
});

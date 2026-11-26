// File : /TeamSamsara.Workflow/engine/src/access/access.test.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Holds decide() to the shared table of cases, and checks rank:
// the highest role counts, Owners rank above everything.

// describe, it and expect come from Vitest's globals (see app/vitest.config.ts).
import { accessCases, caseActor, caseRoles } from "./accessCases.js";
import { decide } from "./decide.js";
import { OwnerRank, permissionsOf, rankOf } from "./model.js";

describe("decide() against the shared cases", () => {
  it.each(accessCases.map((entry) => [entry.name, entry] as const))(
    "%s",
    (_name, entry) => {
      const decision = decide(caseActor(entry.actor), entry.request);
      expect(decision.ok).toBe(entry.allowed);
    },
  );
});

describe("rank", () => {
  it("is the position of the highest role held", () => {
    expect(rankOf(["contributor", "planner"], caseRoles)).toBe(20);
  });

  it("is 0 with no roles, or only roles that no longer exist", () => {
    expect(rankOf([], caseRoles)).toBe(0);
    expect(rankOf(["deleted"], caseRoles)).toBe(0);
  });

  it("puts Owners above every role", () => {
    expect(rankOf(["owner", "contributor"], caseRoles)).toBe(OwnerRank);
  });

  it("gives Owners and Administrators every permission", () => {
    expect(permissionsOf(["owner"], caseRoles).has("tagPeople")).toBe(true);
    expect(permissionsOf(["admin"], caseRoles).has("planEvents")).toBe(true);
    expect(permissionsOf(["contributor"], caseRoles).has("planEvents")).toBe(
      false,
    );
  });
});

describe("reasons", () => {
  it("says it's your own work", () => {
    const decision = decide(caseActor("planner"), {
      action: "task.approve",
      task: {
        groupId: "design",
        memberId: "planner",
        createdBy: "planner",
        event: null,
        sentForReviewBy: "planner",
        awaitingReview: true,
        ranks: { assignee: 20, doer: 20, maker: 20 },
      },
    });
    expect(decision).toEqual({ ok: false, reason: "ownWork" });
  });
});

// File : /TeamSamsara.Workflow/app/src/features/tasks/model/taskScope.test.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tests whose tasks each My tasks scope shows.

import { describe, expect, it } from "vitest";
import { inScope, readScope, scopeGroupIds } from "./taskScope";

interface Task {
  memberId: string | null;
  workGroupId: string | null;
}

const mine: Task = { memberId: "kappa", workGroupId: "marketing" };
const groupOnly = { memberId: null, workGroupId: "marketing" };
const someoneInGroup = { memberId: "salty", workGroupId: "marketing" };
const other = { memberId: null, workGroupId: "bloom" };

describe("inScope", () => {
  const check = (task: Task, scope: "mine" | "groups" | "pick") =>
    inScope(task, scope, "kappa", ["marketing"], ["bloom"]);

  it("shows only what's given to me by name for Mine", () => {
    expect(check(mine, "mine")).toBe(true);
    expect(check(groupOnly, "mine")).toBe(false);
    expect(check(someoneInGroup, "mine")).toBe(false);
  });

  it("adds every task of my groups for My groups", () => {
    expect(check(groupOnly, "groups")).toBe(true);
    expect(check(someoneInGroup, "groups")).toBe(true);
    expect(check(other, "groups")).toBe(false);
  });

  it("adds the picked groups' tasks for Pick groups", () => {
    expect(check(mine, "pick")).toBe(true);
    expect(check(other, "pick")).toBe(true);
    expect(check(groupOnly, "pick")).toBe(false);
  });
});

describe("scopeGroupIds and readScope", () => {
  it("asks for the right groups", () => {
    expect(scopeGroupIds("mine", ["a"], ["b"])).toEqual([]);
    expect(scopeGroupIds("groups", ["a"], ["b"])).toEqual(["a"]);
    expect(scopeGroupIds("pick", ["a"], ["b"])).toEqual(["b"]);
  });

  it("falls back to Mine", () => {
    expect(readScope(null)).toBe("mine");
    expect(readScope("all")).toBe("mine");
    expect(readScope("pick")).toBe("pick");
  });
});

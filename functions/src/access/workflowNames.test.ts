// File : /TeamSamsara.Workflow/functions/src/access/workflowNames.test.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Tests that a workflow save may name only people at or below the
// person who saved it, leaving names already there alone.

import { describe, expect, it } from "vitest";
import { namesAboveSaver, withoutNames } from "./workflowNames.js";

const ranks: Record<string, number> = { boss: 40, lena: 10, dev: 10 };
const rankOf = (id: string) => ranks[id] ?? 0;
const step = (id: string, memberId: string | null) => ({
  id,
  title: id,
  workGroupId: "design",
  memberId,
});

describe("namesAboveSaver", () => {
  it("finds a step newly naming someone above the saver", () => {
    const found = namesAboveSaver(
      [step("a", null)],
      [step("a", "boss"), step("b", "dev")],
      10,
      rankOf,
    );
    expect(found).toEqual([{ stepId: "a", title: "a", memberId: "boss" }]);
  });

  it("leaves names that were already there, and people at the saver's rank", () => {
    expect(
      namesAboveSaver(
        [step("a", "boss")],
        [step("a", "boss"), step("b", "lena")],
        10,
        rankOf,
      ),
    ).toEqual([]);
  });
});

describe("withoutNames", () => {
  it("puts those steps back to their group", () => {
    const steps = [step("a", "boss"), step("b", "dev")];
    expect(
      withoutNames(steps, [{ stepId: "a", title: "a", memberId: "boss" }]),
    ).toEqual([step("a", null), step("b", "dev")]);
  });
});

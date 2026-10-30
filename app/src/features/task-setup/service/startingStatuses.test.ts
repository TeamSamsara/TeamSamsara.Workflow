// File : /TeamSamsara.Workflow/app/src/features/task-setup/service/startingStatuses.test.ts
// Version : 1.0.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : Tests the starting statuses: every required category has one, and
// nothing is added to a list that already has statuses.

import { describe, expect, it } from "vitest";
import { missingStartingStatuses } from "./startingStatuses";
import { RequiredCategories } from "./statusRules";

describe("missingStartingStatuses", () => {
  it("gives an empty workspace every starting status, covering each required category", () => {
    const added = missingStartingStatuses([]);
    expect(added.map((status) => status.name)).toEqual([
      "To do",
      "In review",
      "Approved",
      "Done",
      "Skipped",
    ]);
    for (const category of RequiredCategories) {
      expect(added.some((status) => status.category === category)).toBe(true);
    }
  });

  it("adds nothing when the workspace has statuses", () => {
    expect(
      missingStartingStatuses([
        {
          id: "a",
          name: "Open",
          tone: "neutral",
          category: "open",
          position: 0,
        },
      ]),
    ).toEqual([]);
  });
});

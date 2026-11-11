// File : /TeamSamsara.Workflow/app/src/features/availability/model/teamSections.test.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tests grouping Team availability's people by tag and keeping each viewer's order.

import { describe, expect, it } from "vitest";
import { inOrder, reorderSection, sectionsOf } from "./teamSections";

const people = [
  { id: "salty", name: "Salty", tagIds: ["starter"] },
  { id: "okami", name: "Okami", tagIds: ["starter", "coach"] },
  { id: "david", name: "David", tagIds: ["coach"] },
  { id: "kappa", name: "Kappa", tagIds: [] },
];

describe("sectionsOf", () => {
  it("puts each person under their first tag, untagged last", () => {
    const sections = sectionsOf(people, ["starter", "coach"], []);
    expect(
      sections.map((section) => [
        section.key,
        section.people.map((person) => person.id),
      ]),
    ).toEqual([
      ["starter", ["okami", "salty"]],
      ["coach", ["david"]],
      ["untagged", ["kappa"]],
    ]);
  });

  it("is one group of everyone when there are no tags", () => {
    const sections = sectionsOf(people, [], []);
    expect(sections).toHaveLength(1);
    expect(sections[0].tagId).toBe(null);
  });
});

describe("order", () => {
  it("follows the saved order, then names", () => {
    expect(inOrder(people, ["kappa", "salty"]).map((p) => p.id)).toEqual([
      "kappa",
      "salty",
      "david",
      "okami",
    ]);
  });

  it("gives the whole order when a group is reordered", () => {
    const sections = sectionsOf(people, ["starter", "coach"], []);
    expect(reorderSection(sections, "starter", ["salty", "okami"])).toEqual([
      "salty",
      "okami",
      "david",
      "kappa",
    ]);
  });
});

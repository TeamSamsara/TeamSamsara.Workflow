// File : /TeamSamsara.Workflow/app/src/features/events/model/calendarScope.test.ts
// Version : 1.0.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : Tests which calendar a member gets for what the address asks:
// only View all gets everything or another team's calendar.

import { describe, expect, it } from "vitest";
import { involves } from "../types/audience";
import { readScope } from "./calendarScope";

const kai = { id: "kai", workGroupIds: ["bloom"] };

describe("calendar picker", () => {
  it("gives a member their own calendars only", () => {
    expect(readScope(null, kai, false)).toEqual({ kind: "mine" });
    expect(readScope("bloom", kai, false)).toEqual({
      kind: "group",
      groupId: "bloom",
    });
    expect(readScope("partners", kai, false)).toEqual({ kind: "mine" });
    expect(readScope("all", kai, false)).toEqual({ kind: "mine" });
    expect(readScope("groups", kai, false)).toEqual({ kind: "groups" });
    expect(readScope("groups", { id: "x", workGroupIds: [] }, false)).toEqual({
      kind: "mine",
    });
  });

  it("lets View all pick any group or everything", () => {
    expect(readScope("partners", kai, true)).toEqual({
      kind: "group",
      groupId: "partners",
    });
    expect(readScope("all", kai, true)).toEqual({ kind: "all" });
  });

  it("knows when an event involves someone", () => {
    const audience = {
      everyone: false,
      groupIds: ["bloom"],
      memberIds: ["sam"],
    };
    expect(involves(audience, kai)).toBe(true);
    expect(involves(audience, { id: "sam", workGroupIds: [] })).toBe(true);
    expect(involves(audience, { id: "lee", workGroupIds: ["design"] })).toBe(
      false,
    );
  });
});

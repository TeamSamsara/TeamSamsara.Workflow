// File : /TeamSamsara.Workflow/app/src/features/onboarding/model/chapters.test.ts
// Version : 1.0.0
// Latest commit: feature/onboarding
// Author : Gerrah
// Purpose : Tests which walkthrough chapters (and steps) each person gets for
// their permissions, what's left, and that every chapter ends on "Make it yours".

import { describe, expect, it } from "vitest";
import type { PermissionKey } from "@/core/access";
import { chaptersFor, chaptersLeft, totalMinutes } from "./chapters";

const ids = (permissions: PermissionKey[]) =>
  chaptersFor(new Set(permissions)).map((chapter) => chapter.id);

describe("chapters", () => {
  it("gives a player the basics and Make it yours", () => {
    expect(ids(["doAssignedTasks"])).toEqual([
      "gettingAround",
      "myTasks",
      "yourTime",
      "yours",
    ]);
  });

  it("adds planning and team availability for a team manager", () => {
    expect(ids(["doAssignedTasks", "planEvents", "viewAvailability"])).toEqual([
      "gettingAround",
      "myTasks",
      "yourTime",
      "planning",
      "several",
      "teamAvailability",
      "yours",
    ]);
  });

  it("shows inviting only to people who manage members", () => {
    const settings = (permissions: PermissionKey[]) =>
      chaptersFor(new Set(permissions)).find((c) => c.id === "settings");
    expect(settings(["manageRoles"])?.steps).toHaveLength(1);
    expect(settings(["manageMembers"])?.steps).toHaveLength(2);
    expect(settings(["planEvents"])).toBeUndefined();
  });

  it("leaves out what's done and adds up the minutes", () => {
    const left = chaptersLeft(new Set<PermissionKey>(["doAssignedTasks"]), [
      "gettingAround",
      "myTasks",
    ]);
    expect(left.map((chapter) => chapter.id)).toEqual(["yourTime", "yours"]);
    expect(totalMinutes(left)).toBe(3);
  });
});

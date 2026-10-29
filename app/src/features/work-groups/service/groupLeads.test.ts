// File : /TeamSamsara.Workflow/app/src/features/work-groups/service/groupLeads.test.ts
// Version : 1.0.0
// Latest commit: fix/group-leads-and-x-premium
// Author : Gerrah
// Purpose : Tests who may lead a work group and the link checks.

import { describe, expect, it } from "vitest";
import {
  buildPermissionGrants,
  type MemberRecord,
  type RoleRecord,
} from "@/core/data";
import { ValidationText } from "@/shared/validation/validationContent";
import {
  canLeadGroup,
  canLeadGroups,
  checkLink,
  linkHasErrors,
} from "./groupLeads";

const role = (id: string, permissions: string[]): RoleRecord => ({
  id,
  name: id,
  color: "",
  description: "",
  position: 1,
  permissions,
});
const list = [
  role("everyone", ["viewAll"]),
  role("reviewer", ["approveTasks"]),
  role("dispatcher", ["reassignTasks"]),
  role("admin", ["administrator"]),
  role("editor", ["editAnyTask"]),
];
const roles = { roles: list, grants: buildPermissionGrants(list) };

const member = (
  roleIds: string[],
  status: MemberRecord["status"] = "active",
): MemberRecord => ({
  id: "m",
  displayName: "",
  email: "m@example.com",
  status,
  roleIds,
  workGroupIds: [],
  timeZone: null,
  invitedBy: null,
  invitedAt: null,
  joinedAt: null,
  lastActiveAt: null,
});

describe("canLeadGroups", () => {
  it("needs Approve tasks or Reassign tasks (Administrator counts)", () => {
    expect(canLeadGroups(member(["reviewer"]), roles)).toBe(true);
    expect(canLeadGroups(member(["dispatcher"]), roles)).toBe(true);
    expect(canLeadGroups(member(["admin"]), roles)).toBe(true);
    expect(canLeadGroups(member(["editor"]), roles)).toBe(false);
    expect(canLeadGroups(member([]), roles)).toBe(false);
  });

  it("leaves out people without access", () => {
    expect(canLeadGroups(member(["reviewer"], "disabled"), roles)).toBe(false);
    expect(canLeadGroups(member(["reviewer"], "removed"), roles)).toBe(false);
    expect(canLeadGroups(member(["reviewer"], "invited"), roles)).toBe(true);
  });
});

describe("canLeadGroup", () => {
  it("also needs them to be in the group", () => {
    const inGroup = { ...member(["reviewer"]), workGroupIds: ["video"] };
    expect(canLeadGroup(inGroup, "video", roles)).toBe(true);
    expect(canLeadGroup(inGroup, "design", roles)).toBe(false);
  });
});

describe("checkLink", () => {
  it("accepts a named web address", () => {
    expect(
      linkHasErrors({
        label: "Shared drive",
        url: "https://drive.google.com/x",
      }),
    ).toBe(false);
  });

  it("needs a name and a web address", () => {
    expect(checkLink({ label: " ", url: "drive.google.com" })).toEqual({
      label: ValidationText.linkLabelRequired,
      url: ValidationText.linkInvalid,
    });
    expect(checkLink({ label: "Notes", url: "javascript:alert(1)" }).url).toBe(
      ValidationText.linkInvalid,
    );
    // Only secure addresses, like the security rules.
    expect(
      checkLink({ label: "Old site", url: "http://example.com" }).url,
    ).toBe(ValidationText.linkInvalid);
  });
});

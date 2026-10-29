// File : /TeamSamsara.Workflow/app/src/features/work-groups/service/groupRules.test.ts
// Version : 1.0.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : Tests who may lead a work group and which links are accepted.

import { describe, expect, it } from "vitest";
import { buildPermissionGrants, type RoleRecord } from "@/core/data";
import { GroupRulesText } from "../ui/workGroupsContent";
import { canLeadGroups, checkLink } from "./groupRules";

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
];
const roles = { roles: list, grants: buildPermissionGrants(list) };

describe("canLeadGroups", () => {
  it("lets people who approve or reassign tasks lead", () => {
    expect(canLeadGroups({ roleIds: ["reviewer"] }, roles)).toBe(true);
    expect(canLeadGroups({ roleIds: ["dispatcher"] }, roles)).toBe(true);
    expect(canLeadGroups({ roleIds: ["admin"] }, roles)).toBe(true);
  });

  it("doesn't let anyone else lead", () => {
    expect(canLeadGroups({ roleIds: [] }, roles)).toBe(false);
  });
});

describe("checkLink", () => {
  it("accepts a named web address", () => {
    expect(
      checkLink({
        label: "Shared drive",
        url: " https://drive.google.com/drive/folders/abc ",
      }),
    ).toBeUndefined();
  });

  it("asks for an address, a real one, and a name", () => {
    expect(checkLink({ label: "Drive", url: "" })).toBe(
      GroupRulesText.urlRequired,
    );
    expect(checkLink({ label: "Drive", url: "drive.google.com" })).toBe(
      GroupRulesText.urlInvalid,
    );
    expect(checkLink({ label: "Drive", url: "javascript:alert(1)" })).toBe(
      GroupRulesText.urlInvalid,
    );
    expect(checkLink({ label: " ", url: "https://x.com" })).toBe(
      GroupRulesText.labelRequired,
    );
  });
});

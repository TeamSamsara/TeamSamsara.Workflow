// File : /TeamSamsara.Workflow/app/src/features/work-groups/service/groupRules.ts
// Version : 1.0.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : The checks behind a work group's leads and links: who may lead a
// group (someone who can approve or reassign tasks), and whether a link is a
// web address.

import { resolvePermissions, type PermissionKey } from "@/core/access";
import type { MemberRecord, RolesRecord } from "@/core/data";
import { GroupRulesText } from "../ui/workGroupsContent";

/** Holding either of these lets someone lead a group. */
export const LeadPermissions: readonly PermissionKey[] = [
  "approveTasks",
  "reassignTasks",
];

/** Whether this member's roles let them lead a group. */
export function canLeadGroups(
  member: Pick<MemberRecord, "roleIds">,
  roles: RolesRecord,
): boolean {
  const permissions = resolvePermissions(member.roleIds, roles);
  return LeadPermissions.some((permission) => permissions.has(permission));
}

const webAddress = /^https?:\/\/[^\s/$.?#][^\s]*$/i;

/** The problem with a link, or undefined when it's fine. */
export function checkLink(link: {
  label: string;
  url: string;
}): string | undefined {
  const url = link.url.trim();
  if (!url) return GroupRulesText.urlRequired;
  if (!webAddress.test(url)) return GroupRulesText.urlInvalid;
  if (!link.label.trim()) return GroupRulesText.labelRequired;
  return undefined;
}

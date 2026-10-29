// File : /TeamSamsara.Workflow/app/src/features/work-groups/service/groupLeads.ts
// Version : 1.0.0
// Latest commit: fix/group-leads-and-x-premium
// Author : Gerrah
// Purpose : Who may lead a work group, and checks for a group's links. A lead
// approves and hands out the group's tasks, so they must be in the workspace
// in the group and hold Approve tasks or Reassign tasks (Administrator counts).
// The security rules check the same.

import { resolvePermissions, type PermissionKey } from "@/core/access";
import type { MemberRecord, RolesRecord } from "@/core/data";
import { TextLimits } from "@/shared/validation/textLimits";
import { ValidationText } from "@/shared/validation/validationContent";
import type { WorkGroupLink } from "../types/workGroupTypes";

/** Either of these makes someone able to lead a group. */
export const LeadPermissions: readonly PermissionKey[] = [
  "approveTasks",
  "reassignTasks",
];

/** Whether their roles let them lead a group (they must also be in it; see canLeadGroup). */
export function canLeadGroups(
  member: MemberRecord,
  roles: RolesRecord,
): boolean {
  if (member.status !== "active" && member.status !== "invited") return false;
  const permissions = resolvePermissions(member.roleIds, roles);
  return LeadPermissions.some((permission) => permissions.has(permission));
}

/** A secure web address; firestore.rules accepts the same. */
/** Whether they may lead this group: in it, and able to approve or reassign. */
export function canLeadGroup(
  member: MemberRecord,
  groupId: string,
  roles: RolesRecord,
): boolean {
  return member.workGroupIds.includes(groupId) && canLeadGroups(member, roles);
}

const webAddress = /^https:\/\/[^\s/$.?#][^\s]*$/i;

export interface LinkErrors {
  label?: string;
  url?: string;
}

/** What's wrong with a link, if anything. */
export function checkLink(link: WorkGroupLink): LinkErrors {
  const label = link.label.trim();
  const url = link.url.trim();
  return {
    label: !label
      ? ValidationText.linkLabelRequired
      : label.length > TextLimits.name
        ? ValidationText.nameTooLong(TextLimits.name)
        : undefined,
    url: webAddress.test(url) ? undefined : ValidationText.linkInvalid,
  };
}

export function linkHasErrors(link: WorkGroupLink): boolean {
  const errors = checkLink(link);
  return Boolean(errors.label || errors.url);
}

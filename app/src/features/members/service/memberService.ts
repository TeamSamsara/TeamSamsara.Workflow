// File : /TeamSamsara.Workflow/app/src/features/members/service/memberService.ts
// Version : 2.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Changes to a member made by someone who manages members: their
// name, roles and work groups; turning access off and back on; and removing
// them, which keeps the record (as Removed) so their name stays on old work.
// All of these are protected changes the server makes, checked against rank
// (only people strictly below you) and recorded in the activity history.

import { manage } from "@/core/access";
import type { MemberRecord } from "@/core/data";
import type { MemberDetails } from "../types/memberTypes";

export function saveMemberDetails(
  memberId: string,
  details: MemberDetails,
): Promise<void> {
  return manage({
    op: "member.update",
    memberId,
    displayName: details.displayName.trim(),
    roleIds: details.roleIds,
    workGroupIds: details.workGroupIds,
  });
}

/** They can't sign in until access is turned back on. Nothing else changes. */
export function turnOffAccess(memberId: string): Promise<void> {
  return manage({ op: "member.access", memberId, on: false });
}

/** Back to Active, or to Invited if they never signed in. */
export function turnOnAccess(member: MemberRecord): Promise<void> {
  return manage({ op: "member.access", memberId: member.id, on: true });
}

/** Takes them out of the workspace: no access, no roles, no groups. */
export function removeMember(memberId: string): Promise<void> {
  return manage({ op: "member.remove", memberId });
}

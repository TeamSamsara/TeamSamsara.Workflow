// File : /TeamSamsara.Workflow/app/src/features/members/types/memberTypes.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : Members as the member screens use them: each with their roles and
// work groups joined in, the details a manager edits, and how each invite went.

import type { MemberRecord, RoleRecord } from "@/core/data";
import type { WorkGroupRecord } from "@/features/work-groups";

export interface MemberListItem {
  member: MemberRecord;
  /** Their roles that still exist, top first (Everyone not included). */
  roles: RoleRecord[];
  /** Their work groups that still exist, by name. */
  groups: WorkGroupRecord[];
}

/** What a manager edits on a member's page. */
export interface MemberDetails {
  displayName: string;
  roleIds: string[];
  workGroupIds: string[];
}

/** What to give everyone in one invite. */
export interface InviteChoice {
  roleIds: string[];
  workGroupIds: string[];
}

/**
 * invited: new account and email sent. reinvited: a removed member brought
 * back. alreadyMember: nothing to do. accountExists: the email has a sign-in
 * account but no member record, which only the Firebase console can sort out.
 * failed: something else went wrong.
 */
export type InviteOutcome =
  "invited" | "reinvited" | "alreadyMember" | "accountExists" | "failed";

export interface InviteResult {
  email: string;
  outcome: InviteOutcome;
}

/** A member's name, or their email until a name is set. */
export function memberName(
  member: Pick<MemberRecord, "displayName" | "email">,
): string {
  return member.displayName.trim() || member.email;
}

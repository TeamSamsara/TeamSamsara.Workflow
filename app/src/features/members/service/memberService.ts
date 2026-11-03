// File : /TeamSamsara.Workflow/app/src/features/members/service/memberService.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : Changes to a member made by someone who manages members: their
// name, roles and work groups; turning access off and back on; and removing
// them, which keeps the record (as Removed) so their name stays on old work.

import { doc, updateDoc } from "firebase/firestore";
import { Collections, type MemberRecord } from "@/core/data";
import { db } from "@/lib/firebase";
import type { MemberDetails } from "../types/memberTypes";

const memberRef = (memberId: string) => doc(db, Collections.members, memberId);

export function saveMemberDetails(
  memberId: string,
  details: MemberDetails,
): Promise<void> {
  return updateDoc(memberRef(memberId), {
    displayName: details.displayName.trim(),
    roleIds: details.roleIds,
    workGroupIds: details.workGroupIds,
  });
}

/** They can't sign in until access is turned back on. Nothing else changes. */
export function turnOffAccess(memberId: string): Promise<void> {
  return updateDoc(memberRef(memberId), { status: "disabled" });
}

/** Back to Active, or to Invited if they never signed in. */
export function turnOnAccess(member: MemberRecord): Promise<void> {
  return updateDoc(memberRef(member.id), {
    status: member.joinedAt ? "active" : "invited",
  });
}

/** Takes them out of the workspace: no access, no roles, no groups. */
export function removeMember(memberId: string): Promise<void> {
  return updateDoc(memberRef(memberId), {
    status: "removed",
    roleIds: [],
    workGroupIds: [],
  });
}

// File : /TeamSamsara.Workflow/app/src/features/members/service/inviteService.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : Invites people. For each email: make a sign-in account on the side
// (the inviter stays signed in) with a password nobody sees, write the member
// record as Invited, then send Firebase's email with a link to choose a
// password. A removed member is brought back instead; a current one is left
// alone. Emails go one at a time, so each gets its own result.

import { doc, setDoc, updateDoc } from "firebase/firestore";
import { Collections, serverTime, type MemberRecord } from "@/core/data";
import { authErrorKind, sendPasswordLink } from "@/core/session";
import { db } from "@/lib/firebase";
import { randomSecret } from "@/lib/randomSecret";
import { createAccountOnTheSide } from "@/lib/secondaryAuth";
import type {
  InviteChoice,
  InviteOutcome,
  InviteResult,
} from "../types/memberTypes";

/** Sends (again) the email with the link to choose a password. */
export function sendInviteEmail(email: string): Promise<void> {
  return sendPasswordLink(email, "invite");
}

async function inviteOne(
  email: string,
  choice: InviteChoice,
  inviterId: string,
  existing: MemberRecord | undefined,
): Promise<InviteOutcome> {
  if (existing && existing.status !== "removed") return "alreadyMember";

  if (existing) {
    await updateDoc(doc(db, Collections.members, existing.id), {
      status: "invited",
      roleIds: choice.roleIds,
      workGroupIds: choice.workGroupIds,
      invitedBy: inviterId,
      invitedAt: serverTime(),
    });
    await sendInviteEmail(email);
    return "reinvited";
  }

  let accountId: string;
  try {
    accountId = await createAccountOnTheSide(email, randomSecret());
  } catch (error) {
    if (authErrorKind(error) === "emailInUse") return "accountExists";
    throw error;
  }

  await setDoc(doc(db, Collections.members, accountId), {
    displayName: "",
    email,
    status: "invited",
    roleIds: choice.roleIds,
    workGroupIds: choice.workGroupIds,
    timeZone: null,
    invitedBy: inviterId,
    invitedAt: serverTime(),
    joinedAt: null,
    lastActiveAt: null,
  });
  await sendInviteEmail(email);
  return "invited";
}

/**
 * Invites every email, reporting each one. `members` is everyone with a
 * record (removed ones included), to spot people already here.
 */
export async function inviteMembers(
  emails: readonly string[],
  choice: InviteChoice,
  inviterId: string,
  members: readonly MemberRecord[],
  onProgress?: (result: InviteResult) => void,
): Promise<InviteResult[]> {
  const results: InviteResult[] = [];
  for (const email of emails) {
    const existing = members.find(
      (member) => member.email.toLowerCase() === email.toLowerCase(),
    );
    let outcome: InviteOutcome;
    try {
      outcome = await inviteOne(email, choice, inviterId, existing);
    } catch {
      outcome = "failed";
    }
    const result = { email, outcome };
    results.push(result);
    onProgress?.(result);
  }
  return results;
}

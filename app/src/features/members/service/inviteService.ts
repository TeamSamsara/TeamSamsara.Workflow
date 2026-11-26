// File : /TeamSamsara.Workflow/app/src/features/members/service/inviteService.ts
// Version : 2.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Invites people. For each email the server makes the sign-in
// account and the member record as Invited (checking the roles given are
// strictly below the inviter's), then Firebase's email goes out with a link
// to choose a password. A removed member is brought back instead; a current
// one is left alone. Emails go one at a time, so each gets its own result.

import { manage, manageRefusal } from "@/core/access";
import type { MemberRecord } from "@/core/data";
import { sendPasswordLink } from "@/core/session";
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
  existing: MemberRecord | undefined,
): Promise<InviteOutcome> {
  if (existing && existing.status !== "removed") return "alreadyMember";
  try {
    await manage({
      op: "member.invite",
      email,
      roleIds: choice.roleIds,
      workGroupIds: choice.workGroupIds,
    });
  } catch (error) {
    if (manageRefusal(error) === "alreadyMember") return "alreadyMember";
    throw error;
  }
  await sendInviteEmail(email);
  return existing ? "reinvited" : "invited";
}

/**
 * Invites every email, reporting each one. `members` is everyone with a
 * record (removed ones included), to spot people already here.
 */
export async function inviteMembers(
  emails: readonly string[],
  choice: InviteChoice,
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
      outcome = await inviteOne(email, choice, existing);
    } catch {
      outcome = "failed";
    }
    const result = { email, outcome };
    results.push(result);
    onProgress?.(result);
  }
  return results;
}

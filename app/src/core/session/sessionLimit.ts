// File : /TeamSamsara.Workflow/app/src/core/session/sessionLimit.ts
// Version : 1.0.0
// Latest commit: feature/remember-me
// Author : Gerrah
// Purpose : Ends a sign-in that has outlasted the workspace's limit, and tells
// the sign-in page why, so the person isn't left wondering.

import { signedInAt, signOut } from "./authService";

const noticeKey = "playbook:sessionEnded";
const day = 24 * 60 * 60 * 1000;

/** True when this sign-in is older than the limit (0 days is no limit). */
export async function isPastLimit(days: number, now = new Date()) {
  if (days <= 0) return false;
  const since = await signedInAt();
  return since !== null && now.getTime() - since.getTime() > days * day;
}

/** Signs out, leaving a note for the sign-in page. */
export async function endSession(): Promise<void> {
  try {
    sessionStorage.setItem(noticeKey, "1");
  } catch {
    // Private windows may refuse; the sign-out still happens.
  }
  await signOut();
}

/** Whether the last sign-out was the limit's doing; reads it once. */
export function takeSessionEndedNotice(): boolean {
  try {
    const ended = sessionStorage.getItem(noticeKey) === "1";
    sessionStorage.removeItem(noticeKey);
    return ended;
  } catch {
    return false;
  }
}

// File : /TeamSamsara.Workflow/app/src/core/session/sessionState.ts
// Version : 1.0.0
// Latest commit: core/session
// Author : Gerrah
// Purpose : Works out the session from the two things it depends on: the
// signed-in account and that account's member record. Kept apart from React so
// every case can be tested.

import type { LiveResult, MemberRecord } from "@/core/data";
import type { SessionState, SessionUser } from "./sessionTypes";

/** undefined while Firebase is still checking whether someone is signed in. */
export type AuthUserState = SessionUser | null | undefined;

export function deriveSessionState(
  user: AuthUserState,
  member: LiveResult<MemberRecord | null>,
): SessionState {
  if (user === undefined) return { status: "loading" };
  if (user === null) return { status: "signedOut" };

  switch (member.status) {
    case "idle":
    case "loading":
      return { status: "loading" };
    case "error":
      return { status: "error", user };
    case "ready":
      break;
  }

  const record = member.data;
  if (!record) return { status: "noAccess", user, reason: "noRecord" };
  if (record.status === "disabled") {
    return { status: "noAccess", user, reason: "disabled" };
  }
  // Invited members are let in: signing in for the first time is what makes them active.
  return { status: "active", user, member: record };
}

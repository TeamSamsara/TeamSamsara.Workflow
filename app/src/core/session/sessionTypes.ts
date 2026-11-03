// File : /TeamSamsara.Workflow/app/src/core/session/sessionTypes.ts
// Version : 1.0.0
// Latest commit: core/session
// Author : Gerrah
// Purpose : Who is using the app right now. A password alone never opens the app:
// signing in also needs an active (or newly invited) member record.

import type { MemberRecord } from "@/core/data";

/** The signed-in sign-in account, as much of it as the app uses. */
export interface SessionUser {
  id: string;
  email: string;
}

/**
 * noRecord: signed in, but there is no member record (never invited, or removed).
 * disabled: an admin turned off this member's access.
 */
export type NoAccessReason = "noRecord" | "disabled";

export type SessionState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "noAccess"; user: SessionUser; reason: NoAccessReason }
  | { status: "active"; user: SessionUser; member: MemberRecord }
  /** The member record could not be read (offline on a first visit, for example). */
  | { status: "error"; user: SessionUser };

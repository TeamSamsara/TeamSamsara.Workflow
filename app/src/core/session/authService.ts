// File : /TeamSamsara.Workflow/app/src/core/session/authService.ts
// Version : 1.1.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : Everything the app asks Firebase Auth to do: sign in and out, send
// the password link, check a link's code, and set the new password from it.
// Invites and resets use the same password link.

import {
  confirmPasswordReset,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  verifyPasswordResetCode,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { RoutePaths } from "@/shared/constants/routePaths";
import { inviteMarkerParameter, type PasswordLinkPurpose } from "./actionLink";

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

/**
 * Sends the email with a link to choose a password. An invite marks the link so
 * the page greets the person; either way they land on sign-in afterwards.
 */
export function sendPasswordLink(
  email: string,
  purpose: PasswordLinkPurpose = "reset",
): Promise<void> {
  const continueUrl = new URL(RoutePaths.signIn, window.location.origin);
  if (purpose === "invite") {
    continueUrl.searchParams.set(inviteMarkerParameter, "1");
  }
  return sendPasswordResetEmail(auth, email.trim(), {
    url: continueUrl.toString(),
  });
}

/** Checks a link's code is still good, and gives the email it was sent to. */
export function checkPasswordLink(code: string): Promise<string> {
  return verifyPasswordResetCode(auth, code);
}

/** Saves the new password from a link, then signs the person in with it. */
export async function setPasswordFromLink(
  code: string,
  email: string,
  newPassword: string,
): Promise<void> {
  await confirmPasswordReset(auth, code, newPassword);
  await signIn(email, newPassword);
}

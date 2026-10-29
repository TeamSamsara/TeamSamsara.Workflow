// File : /TeamSamsara.Workflow/app/src/core/session/authService.ts
// Version : 1.0.0
// Latest commit: core/session
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

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

/** Sends the email with a link to choose a password. After saving it, people land on sign-in. */
export function sendPasswordLink(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email.trim(), {
    url: `${window.location.origin}${RoutePaths.signIn}`,
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

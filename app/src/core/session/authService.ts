// File : /TeamSamsara.Workflow/app/src/core/session/authService.ts
// Version : 1.2.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : Everything the app asks Firebase Auth to do: sign in and out, send
// the password link, check a link's code, and set the new password from it.
// Invites and resets use the same password link.

import {
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  verifyPasswordResetCode,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { RoutePaths } from "@/shared/constants/routePaths";
import { inviteMarkerParameter, type PasswordLinkPurpose } from "./actionLink";
import type { SessionUser } from "./sessionTypes";

function toSessionUser(user: User): SessionUser {
  return { id: user.uid, email: user.email ?? "" };
}

export async function signIn(
  email: string,
  password: string,
): Promise<SessionUser> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return toSessionUser(result.user);
}

/**
 * Creates a sign-in account and signs in with it. Only first-time setup does
 * this; everyone else is invited. The account has no access until a member
 * record exists for it.
 */
export async function createAccount(
  email: string,
  password: string,
): Promise<SessionUser> {
  const result = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  return toSessionUser(result.user);
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

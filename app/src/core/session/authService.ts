// File : /TeamSamsara.Workflow/app/src/core/session/authService.ts
// Version : 1.5.0
// Latest commit: feature/branded-emails
// Author : Gerrah
// Purpose : Everything the app asks Firebase Auth to do: sign in and out, check
// a password link's code, and set the new password from it. The links
// themselves (invites and resets) are emailed by the server, in Playbook's
// own email design.

import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  EmailAuthProvider,
  confirmPasswordReset,
  reauthenticateWithCredential,
  updatePassword,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  verifyPasswordResetCode,
  type User,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "@/lib/firebase";
import type { PasswordLinkPurpose } from "./actionLink";
import { WrongCurrentPassword } from "./authErrors";
import type { SessionUser } from "./sessionTypes";

function toSessionUser(user: User): SessionUser {
  return { id: user.uid, email: user.email ?? "" };
}

/**
 * Signs in. Kept, it lasts on this browser until it signs out (or the
 * workspace's limit runs out); not kept, it ends when the browser closes.
 */
export async function signIn(
  email: string,
  password: string,
  keep = true,
): Promise<SessionUser> {
  await setPersistence(
    auth,
    keep ? browserLocalPersistence : browserSessionPersistence,
  );
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return toSessionUser(result.user);
}

/** When the signed-in person last typed their password; null when signed out. */
export async function signedInAt(): Promise<Date | null> {
  const user = auth.currentUser;
  if (!user) return null;
  const token = await user.getIdTokenResult();
  return token.authTime ? new Date(token.authTime) : null;
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
 * Has the server email a link to choose a password: an invite (Manage members
 * only, to someone Invited) or a reset (anyone; the answer is the same whether
 * or not the email has an account).
 */
export async function sendPasswordLink(
  email: string,
  purpose: PasswordLinkPurpose = "reset",
): Promise<void> {
  const name = purpose === "invite" ? "sendInvite" : "sendPasswordReset";
  await httpsCallable<{ email: string }, unknown>(
    functions,
    name,
  )({
    email: email.trim(),
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

/**
 * Changes the signed-in person's password. Firebase wants proof it's them, so
 * the current password is checked first; a wrong one fails as such.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("Not signed in");
  try {
    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email, currentPassword),
    );
  } catch (error) {
    throw new WrongCurrentPassword(error);
  }
  await updatePassword(user, newPassword);
}

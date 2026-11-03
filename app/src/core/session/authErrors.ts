// File : /TeamSamsara.Workflow/app/src/core/session/authErrors.ts
// Version : 1.3.0
// Latest commit: feature/branded-emails
// Author : Gerrah
// Purpose : Sorts Firebase sign-in errors into the few reasons people are told
// about. Wrong email and wrong password are deliberately the same reason, so the
// sign-in page never reveals which emails have an account.

import { FirebaseError } from "firebase/app";

export type AuthErrorKind =
  | "wrongCredentials"
  | "tooManyAttempts"
  | "linkExpired"
  | "linkInvalid"
  | "weakPassword"
  | "emailInUse"
  | "wrongCurrentPassword"
  | "offline"
  | "unknown";

const kindByCode: Record<string, AuthErrorKind> = {
  "auth/invalid-credential": "wrongCredentials",
  "auth/invalid-login-credentials": "wrongCredentials",
  "auth/wrong-password": "wrongCredentials",
  "auth/user-not-found": "wrongCredentials",
  "auth/invalid-email": "wrongCredentials",
  "auth/user-disabled": "wrongCredentials",
  "auth/too-many-requests": "tooManyAttempts",
  "auth/expired-action-code": "linkExpired",
  "auth/invalid-action-code": "linkInvalid",
  "auth/weak-password": "weakPassword",
  "auth/email-already-in-use": "emailInUse",
  "auth/requires-recent-login": "wrongCurrentPassword",
  "auth/network-request-failed": "offline",
  // Password links come from the server: a bad email is treated like one with no account.
  "functions/invalid-argument": "wrongCredentials",
  "functions/unavailable": "offline",
};

/** The current password given when changing it didn't match. */
export class WrongCurrentPassword extends Error {
  readonly reason: unknown;
  constructor(reason: unknown) {
    super("Wrong current password");
    this.reason = reason;
  }
}

export function authErrorKind(error: unknown): AuthErrorKind {
  if (error instanceof WrongCurrentPassword) {
    return authErrorKind(error.reason) === "tooManyAttempts"
      ? "tooManyAttempts"
      : "wrongCurrentPassword";
  }
  if (error instanceof FirebaseError) {
    return kindByCode[error.code] ?? "unknown";
  }
  return "unknown";
}

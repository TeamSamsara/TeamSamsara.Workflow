// File : /TeamSamsara.Workflow/app/src/core/session/authErrors.ts
// Version : 1.0.0
// Latest commit: core/session
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
  "auth/requires-recent-login": "wrongCurrentPassword",
  "auth/network-request-failed": "offline",
};

export function authErrorKind(error: unknown): AuthErrorKind {
  if (error instanceof FirebaseError) {
    return kindByCode[error.code] ?? "unknown";
  }
  return "unknown";
}

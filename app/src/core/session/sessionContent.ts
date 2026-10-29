// File : /TeamSamsara.Workflow/app/src/core/session/sessionContent.ts
// Version : 1.1.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : What people read when signing in, or using an email link, goes wrong.

import type { AuthErrorKind } from "./authErrors";

export const AuthErrorText: Record<AuthErrorKind, string> = {
  wrongCredentials:
    "That email and password don't match. Check them and try again, or reset your password.",
  tooManyAttempts:
    "Too many tries. Wait a few minutes before trying again, or reset your password.",
  linkExpired:
    "This link has expired. Links are good for 1 hour and work only once.",
  linkInvalid: "This link has already been used or isn't complete.",
  weakPassword: "Choose a longer password, with a number or a symbol.",
  emailInUse:
    "This email already has an account, and that isn't its password. Enter its password, or use another email.",
  wrongCurrentPassword: "Your current password isn't right.",
  offline: "You seem to be offline. Check your connection and try again.",
  unknown: "Something went wrong. Try again in a moment.",
};

export const SessionText = {
  loading: "Checking your sign-in",
  unavailableTitle: "Can't check your access",
  unavailableBody:
    "Workflow couldn't load your member record. Check your connection, then try again.",
  tryAgain: "Try again",
  signOut: "Sign out",
} as const;

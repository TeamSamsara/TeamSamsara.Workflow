// File : /TeamSamsara.Workflow/app/src/core/data/dataErrors.ts
// Version : 1.0.0
// Latest commit: core/data
// Author : Gerrah
// Purpose : Sorts Firestore errors into the few kinds the screens care about, and
// gives the message to show for each.

import { FirebaseError } from "firebase/app";
import { DataErrorText } from "./dataContent";

export type DataErrorKind =
  "offline" | "notAllowed" | "notFound" | "conflict" | "unknown";

const kindByCode: Record<string, DataErrorKind> = {
  "permission-denied": "notAllowed",
  unauthenticated: "notAllowed",
  "not-found": "notFound",
  unavailable: "offline",
  "deadline-exceeded": "offline",
  "already-exists": "conflict",
  aborted: "conflict",
  "failed-precondition": "conflict",
};

export function dataErrorKind(error: unknown): DataErrorKind {
  if (error instanceof FirebaseError) {
    // Firestore codes arrive bare ("not-found") or prefixed ("firestore/not-found").
    const code = error.code.replace(/^firestore\//, "");
    return kindByCode[code] ?? "unknown";
  }
  return "unknown";
}

export function dataErrorMessage(error: unknown): string {
  return DataErrorText[dataErrorKind(error)];
}

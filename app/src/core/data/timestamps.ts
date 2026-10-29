// File : /TeamSamsara.Workflow/app/src/core/data/timestamps.ts
// Version : 1.0.0
// Latest commit: core/data
// Author : Gerrah
// Purpose : Converts between the Dates the app uses and the Timestamps Firestore
// stores, and gives the "set this to the server's time" marker.

import {
  serverTimestamp,
  Timestamp,
  type FieldValue,
} from "firebase/firestore";

/** A Firestore Timestamp (or anything shaped like one) as a Date; null otherwise. */
export function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (isTimestampLike(value)) {
    return new Timestamp(value.seconds, value.nanoseconds).toDate();
  }
  return null;
}

/** A Date as a Firestore Timestamp, or null when there is no date. */
export function fromDate(date: Date | null): Timestamp | null {
  return date ? Timestamp.fromDate(date) : null;
}

/** Tells Firestore to fill in its own clock when the write arrives. */
export function serverTime(): FieldValue {
  return serverTimestamp();
}

function isTimestampLike(
  value: unknown,
): value is { seconds: number; nanoseconds: number } {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.seconds === "number" &&
    typeof candidate.nanoseconds === "number"
  );
}

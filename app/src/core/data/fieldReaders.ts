// File : /TeamSamsara.Workflow/app/src/core/data/fieldReaders.ts
// Version : 1.0.0
// Latest commit: core/data
// Author : Gerrah
// Purpose : Reads one field of a Firestore document safely. A missing or wrong
// field gives the fallback instead of breaking the page, so a record written by
// an older version of the app, or by hand, still loads.

import type { DocumentData } from "firebase/firestore";
import { toDate } from "./timestamps";

export function readString(
  data: DocumentData,
  field: string,
  fallback = "",
): string {
  const value = data[field];
  return typeof value === "string" ? value : fallback;
}

export function readOptionalString(
  data: DocumentData,
  field: string,
): string | null {
  const value = data[field];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function readNumber(
  data: DocumentData,
  field: string,
  fallback = 0,
): number {
  const value = data[field];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function readBoolean(
  data: DocumentData,
  field: string,
  fallback = false,
): boolean {
  const value = data[field];
  return typeof value === "boolean" ? value : fallback;
}

/** A list of strings; anything in the list that is not a string is dropped. */
export function readStringList(data: DocumentData, field: string): string[] {
  const value = data[field];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

/** One of a fixed set of values, or the fallback when it is anything else. */
export function readChoice<TChoice extends string>(
  data: DocumentData,
  field: string,
  choices: readonly TChoice[],
  fallback: TChoice,
): TChoice {
  const value = data[field];
  return choices.find((choice) => choice === value) ?? fallback;
}

/** A Firestore timestamp as a Date, or null when it is missing. */
export function readDate(data: DocumentData, field: string): Date | null {
  return toDate(data[field]);
}

/** A nested map, or an empty one when the field is missing or not a map. */
export function readMap(data: DocumentData, field: string): DocumentData {
  const value = data[field];
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as DocumentData)
    : {};
}

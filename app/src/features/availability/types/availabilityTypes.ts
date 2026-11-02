// File : /TeamSamsara.Workflow/app/src/features/availability/types/availabilityTypes.ts
// Version : 1.0.0
// Latest commit: feature/people-time
// Author : Gerrah
// Purpose : When people are free. Availability is a member's usual week (the
// hours they're unavailable, per weekday) and the dates that differ. A
// personal appointment has its details (for the member and managers) and a
// busy copy with only its times (for everyone).

import type { DocumentData } from "firebase/firestore";
import {
  createConverter,
  readBoolean,
  readDate,
  readOptionalString,
  readString,
} from "@/core/data";

/** A date unlike the usual week: unavailable or available, all day or between two times. */
export interface AvailabilityException {
  /** "2026-11-14" */
  date: string;
  /** "18:00", or null for the whole day. */
  from: string | null;
  to: string | null;
  available: boolean;
}

export interface AvailabilityRecord {
  memberId: string;
  /** Weekday (0 = Sunday) → hours (0-23) usually unavailable. */
  weekly: Record<number, number[]>;
  exceptions: AvailabilityException[];
  updatedAt: Date | null;
}

export interface PersonalEntry {
  id: string;
  memberId: string;
  title: string;
  notes: string;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date | null;
}

/** A personal appointment as everyone else sees it: just when. */
export interface BusyEntry {
  id: string;
  memberId: string;
  startsAt: Date;
  endsAt: Date;
}

/** Sizes the app keeps to (firestore.rules checks the same). */
export const AvailabilityLimits = {
  exceptions: 60,
  title: 120,
  notes: 1000,
} as const;

function readWeekly(data: DocumentData): Record<number, number[]> {
  const stored: unknown = data.weekly;
  const weekly: Record<number, number[]> = {};
  if (!stored || typeof stored !== "object") return weekly;
  for (const [day, hours] of Object.entries(
    stored as Record<string, unknown>,
  )) {
    const index = Number(day);
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index > 6 ||
      !Array.isArray(hours)
    )
      continue;
    weekly[index] = [
      ...new Set(
        hours.filter(
          (hour): hour is number =>
            Number.isInteger(hour) && hour >= 0 && hour <= 23,
        ),
      ),
    ].sort((a, b) => a - b);
  }
  return weekly;
}

function readExceptions(data: DocumentData): AvailabilityException[] {
  const stored: unknown = data.exceptions;
  if (!Array.isArray(stored)) return [];
  return stored
    .filter(
      (entry): entry is DocumentData =>
        Boolean(entry) && typeof entry === "object",
    )
    .map((entry) => ({
      date: readString(entry, "date"),
      from: readOptionalString(entry, "from"),
      to: readOptionalString(entry, "to"),
      available: readBoolean(entry, "available"),
    }))
    .filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.date));
}

export const availabilityConverter = createConverter<AvailabilityRecord>({
  parse: (id, data) => ({
    memberId: id,
    weekly: readWeekly(data),
    exceptions: readExceptions(data),
    updatedAt: readDate(data, "updatedAt"),
  }),
  serialize: (record) => ({
    weekly: Object.fromEntries(
      Object.entries(record.weekly).map(([day, hours]) => [day, hours]),
    ),
    exceptions: record.exceptions,
  }),
});

export const personalConverter = createConverter<PersonalEntry>({
  parse: (id, data) => ({
    id,
    memberId: readString(data, "memberId"),
    title: readString(data, "title"),
    notes: readString(data, "notes"),
    startsAt: readDate(data, "startsAt") ?? new Date(0),
    endsAt: readDate(data, "endsAt") ?? new Date(0),
    createdAt: readDate(data, "createdAt"),
  }),
  serialize: (entry) =>
    Object.fromEntries(Object.entries(entry).filter(([key]) => key !== "id")),
});

export const busyConverter = createConverter<BusyEntry>({
  parse: (id, data) => ({
    id,
    memberId: readString(data, "memberId"),
    startsAt: readDate(data, "startsAt") ?? new Date(0),
    endsAt: readDate(data, "endsAt") ?? new Date(0),
  }),
  serialize: (entry) =>
    Object.fromEntries(Object.entries(entry).filter(([key]) => key !== "id")),
});

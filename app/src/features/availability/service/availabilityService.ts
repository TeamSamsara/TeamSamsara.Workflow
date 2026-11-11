// File : /TeamSamsara.Workflow/app/src/features/availability/service/availabilityService.ts
// Version : 1.2.0
// Latest commit: fix/private-appointments
// Author : Gerrah
// Purpose : Saves a member's usual week and exceptions, and adds, changes and
// removes personal appointments together with their busy copies (one batch,
// so the two always match). An appointment is private unless its owner
// shares it with their group leads.

import { collection, doc } from "firebase/firestore";
import { Collections, commitWrites, fromDate, serverTime } from "@/core/data";
import { db } from "@/lib/firebase";
import {
  AvailabilityLimits,
  type AvailabilityException,
} from "../types/availabilityTypes";

/** Saves the usual week and exceptions, in the member's own time zone. */
export function saveAvailability(
  memberId: string,
  weekly: Record<number, number[]>,
  exceptions: readonly AvailabilityException[],
  timeZone: string,
): Promise<void> {
  const data = {
    weekly: Object.fromEntries(
      Object.entries(weekly)
        .filter(([, hours]) => hours.length > 0)
        .map(([day, hours]) => [
          day,
          [...new Set(hours)].sort((a, b) => a - b),
        ]),
    ),
    exceptions: [...exceptions]
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          (a.from ?? "").localeCompare(b.from ?? ""),
      )
      .slice(0, AvailabilityLimits.exceptions),
    timeZone,
    updatedAt: serverTime(),
  };
  return commitWrites(db, [
    (batch) => batch.set(doc(db, Collections.availability, memberId), data),
  ]);
}

export interface PersonalFields {
  title: string;
  notes: string;
  startsAt: Date;
  endsAt: Date;
  /** Who else sees what it is (the owner's group leads), or nobody. */
  visibleTo: readonly string[];
}

/** The most people one appointment can be shared with (firestore.rules checks the same). */
export const sharedWithAtMost = 30;

/** Adds an appointment (no id) or changes one; gives back its id. */
export async function savePersonal(
  memberId: string,
  fields: PersonalFields,
  existing?: { id: string; createdAt: Date | null },
): Promise<string> {
  const id = existing?.id ?? doc(collection(db, Collections.personal)).id;
  const times = {
    startsAt: fromDate(fields.startsAt),
    endsAt: fromDate(fields.endsAt),
  };
  await commitWrites(db, [
    (batch) =>
      batch.set(doc(db, Collections.personal, id), {
        memberId,
        title: fields.title.trim(),
        notes: fields.notes.trim(),
        visibleTo: [...new Set(fields.visibleTo)]
          .filter((id) => id !== memberId)
          .slice(0, sharedWithAtMost),
        ...times,
        createdAt: existing?.createdAt
          ? fromDate(existing.createdAt)
          : serverTime(),
        updatedAt: serverTime(),
      }),
    (batch) => batch.set(doc(db, Collections.busy, id), { memberId, ...times }),
  ]);
  return id;
}

export function deletePersonal(id: string): Promise<void> {
  return commitWrites(db, [
    (batch) => batch.delete(doc(db, Collections.personal, id)),
    (batch) => batch.delete(doc(db, Collections.busy, id)),
  ]);
}

// File : /TeamSamsara.Workflow/app/src/features/account/service/accountService.ts
// Version : 1.0.0
// Latest commit: feature/your-account
// Author : Gerrah
// Purpose : Saves what a person changes about themselves on Your account:
// their name, in-game name, time zone and date and time formats. Their usual
// week is in their own time zone, so it follows when the zone changes (same
// batch, so the two never disagree).

import { doc } from "firebase/firestore";
import {
  Collections,
  commitWrites,
  serverTime,
  type BatchWrite,
  type DateFormat,
  type TimeFormat,
} from "@/core/data";
import { db } from "@/lib/firebase";

export interface AccountFields {
  displayName: string;
  gameName: string;
  /** null: the workspace's. */
  timeZone: string | null;
  dateFormat: DateFormat | null;
  timeFormat: TimeFormat | null;
}

export const AccountLimits = { name: 80, gameName: 40 } as const;

export function saveAccount(
  memberId: string,
  fields: AccountFields,
  /** The zone their usual week is in now, when they have one saved. */
  availabilityZone: string | null,
  /** The zone they'll see times in after saving. */
  shownZone: string,
): Promise<void> {
  const writes: BatchWrite[] = [
    (batch) =>
      batch.update(doc(db, Collections.members, memberId), {
        displayName: fields.displayName.trim().slice(0, AccountLimits.name),
        gameName:
          fields.gameName.trim().slice(0, AccountLimits.gameName) || null,
        timeZone: fields.timeZone,
        dateFormat: fields.dateFormat,
        timeFormat: fields.timeFormat,
      }),
  ];
  if (availabilityZone !== null && availabilityZone !== shownZone)
    writes.push((batch) =>
      batch.update(doc(db, Collections.availability, memberId), {
        timeZone: shownZone,
        updatedAt: serverTime(),
      }),
    );
  return commitWrites(db, writes);
}

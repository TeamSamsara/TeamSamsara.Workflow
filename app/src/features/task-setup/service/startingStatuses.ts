// File : /TeamSamsara.Workflow/app/src/features/task-setup/service/startingStatuses.ts
// Version : 1.0.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : Puts the starting statuses into a workspace that has none (one made
// before statuses existed). New workspaces get them at setup already. Nothing
// is written when there are statuses, so it can't add them twice.

import { collection, doc } from "firebase/firestore";
import { Collections, commitWrites, type StatusRecord } from "@/core/data";
import { defaultStatuses } from "@/core/workspace";
import { db } from "@/lib/firebase";

/** The statuses to add: all the starting ones for an empty list, else none. */
export function missingStartingStatuses(
  existing: readonly StatusRecord[],
): Omit<StatusRecord, "id">[] {
  return existing.length === 0 ? [...defaultStatuses] : [];
}

export function addStartingStatuses(
  existing: readonly StatusRecord[],
): Promise<void> {
  return commitWrites(
    db,
    missingStartingStatuses(existing).map(
      (status) => (batch) =>
        batch.set(doc(collection(db, Collections.statuses)), status),
    ),
  );
}

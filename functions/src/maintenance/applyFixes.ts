// File : /TeamSamsara.Workflow/functions/src/maintenance/applyFixes.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Reading the whole database into plain copies for the check-up,
// and writing its fixes in batches of up to 500. Running it twice does no
// harm: a second check finds nothing left to fix.

import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type Firestore,
} from "firebase-admin/firestore";
import type { Doc, Fix, Snapshot } from "./findOrphans.js";

/** Timestamps become Dates all the way down, so the check-up sees plain values. */
function plain(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate();
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        plain(entry),
      ]),
    );
  }
  return value;
}

async function all(db: Firestore, collection: string): Promise<Doc[]> {
  const snapshot = await db.collection(collection).get();
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...(plain(doc.data()) as DocumentData) }) as Doc,
  );
}

const recordCollections = ["sentReminders", "workflowSyncs", "bulkPlans"];

export async function readSnapshot(db: Firestore): Promise<Snapshot> {
  const [
    members,
    workGroups,
    peopleTags,
    events,
    repeats,
    eventSets,
    tasks,
    personal,
    busy,
    notifications,
    ...records
  ] = await Promise.all([
    all(db, "members"),
    all(db, "workGroups"),
    all(db, "peopleTags"),
    all(db, "events"),
    all(db, "repeats"),
    all(db, "eventSets"),
    all(db, "tasks"),
    all(db, "personal"),
    all(db, "busy"),
    all(db, "notifications"),
    ...recordCollections.map((name) => all(db, name)),
  ]);
  return {
    members,
    workGroups,
    peopleTags,
    events,
    repeats,
    eventSets,
    tasks,
    personal,
    busy,
    notifications,
    records: records.flatMap((docs, index) =>
      docs.map((doc) => ({
        collection: recordCollections[index],
        id: doc.id,
        at: doc.at instanceof Date ? doc.at : null,
      })),
    ),
  };
}

/** Writes the fixes, 500 to a batch. Gives back how many were written. */
export async function applyFixes(
  db: Firestore,
  fixes: readonly Fix[],
): Promise<number> {
  for (let start = 0; start < fixes.length; start += 500) {
    const batch = db.batch();
    for (const fix of fixes.slice(start, start + 500)) {
      const ref = db.doc(fix.path);
      if (fix.kind === "delete") batch.delete(ref);
      else {
        const changes = { ...fix.changes };
        // Tasks note when they last changed, like every other write to them.
        if (fix.path.startsWith("tasks/"))
          changes.updatedAt = FieldValue.serverTimestamp();
        batch.update(ref, changes);
      }
    }
    await batch.commit();
  }
  return fixes.length;
}

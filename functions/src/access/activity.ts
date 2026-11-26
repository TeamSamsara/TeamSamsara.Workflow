// File : /TeamSamsara.Workflow/functions/src/access/activity.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : The activity history: who changed what, when, for the important
// admin actions. Only the server writes it, nobody edits or deletes it, and
// the weekly check-up clears entries older than a year. Protected changes
// record themselves as they're made; settings people still change directly
// are recorded here when their records change, with who made the write.

import {
  FieldValue,
  type DocumentData,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import { onDocumentWrittenWithAuthContext } from "firebase-functions/v2/firestore";
import { getFirestore } from "firebase-admin/firestore";
import type { ActivityArea, ActivityEntry } from "./managePlan.js";

/** How long entries are kept before the weekly check-up clears them. */
export const activityKeepDays = 365;

/** Adds one entry to the history, inside the same write as the change. */
export function recordActivity(
  db: Firestore,
  writer: Transaction,
  actorId: string | null,
  entry: ActivityEntry,
): void {
  writer.set(db.collection("activity").doc(), {
    ...entry,
    actorId,
    at: FieldValue.serverTimestamp(),
  });
}

/** A member's id from a write's auth context (never a service account's email). */
const memberIdOf = (authType: string, authId: string | undefined) =>
  authType === "service_account" || !authId || authId.includes("@")
    ? null
    : authId;

/** Fields that changed between two versions of a record, both sides. */
function changes(
  before: DocumentData | undefined,
  after: DocumentData | undefined,
  ignore: readonly string[],
) {
  const keys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);
  const was: Record<string, unknown> = {};
  const now: Record<string, unknown> = {};
  for (const key of keys) {
    if (ignore.includes(key)) continue;
    const a = JSON.stringify(before?.[key] ?? null);
    const b = JSON.stringify(after?.[key] ?? null);
    if (a === b) continue;
    was[key] = before?.[key] ?? null;
    now[key] = after?.[key] ?? null;
  }
  return Object.keys(now).length ? { was, now } : null;
}

/** Watches a settings record and records each person's change to it. */
function watchSettings(
  document: string,
  area: ActivityArea,
  label: string,
  ignore: readonly string[] = ["updatedAt"],
) {
  return onDocumentWrittenWithAuthContext({ document }, async (event) => {
    const actorId = memberIdOf(event.authType, event.authId);
    // The server's own writes (protected changes, updates) record themselves.
    if (!actorId) return;
    const diff = changes(
      event.data?.before.data(),
      event.data?.after.data(),
      ignore,
    );
    if (!diff) return;
    const db = getFirestore();
    await db.collection("activity").add({
      area,
      action: event.data?.after.exists ? "changed" : "deleted",
      targetId: event.params.id ?? null,
      summary: `Changed ${label}`,
      before: diff.was,
      after: diff.now,
      actorId,
      at: FieldValue.serverTimestamp(),
    } satisfies ActivityEntry & DocumentData);
  });
}

export const onWorkspaceSettingsChanged = watchSettings(
  "config/workspace",
  "settings",
  "the workspace settings",
);
export const onSignInPicturesChanged = watchSettings(
  "config/signin",
  "settings",
  "the sign-in pictures",
);
export const onMaintenanceChanged = watchSettings(
  "config/maintenance",
  "settings",
  "whether the weekly check-up applies its fixes",
);
export const onStatusChanged = watchSettings(
  "statuses/{id}",
  "settings",
  "a task status",
);
export const onWorkGroupChanged = watchSettings(
  "workGroups/{id}",
  "groups",
  "a work group",
);

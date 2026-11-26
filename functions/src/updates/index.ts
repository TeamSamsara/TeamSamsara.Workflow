// File : /TeamSamsara.Workflow/functions/src/updates/index.ts
// Version : 1.2.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Platform updates: one-time changes to the stored data that ship
// with a release. Each is listed here in order; config/platformUpdates keeps
// which ones ran, when and what they changed. A background job applies any
// pending ones shortly after a deploy (every 10 minutes it checks, one read),
// and Administrators can check them (report only) or apply them now from
// Settings › General, which is also how to run them in the local emulators.
// A run takes a lock, so two can't overlap, and stops at the first failure.

import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { onCall } from "firebase-functions/v2/https";
import { requireActor, requireAllowed } from "../access/readAccess.js";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { ownersAndRanks } from "./ownersAndRanks.js";
import { tasksFollowWorkflows } from "./tasksFollowWorkflows.js";
import type { PlatformUpdate, UpdateReport } from "./types.js";

/** Every update, oldest first. Add new ones at the end; never reorder. */
export const platformUpdates: readonly PlatformUpdate[] = [
  tasksFollowWorkflows,
  ownersAndRanks,
];

const stateDoc = "config/platformUpdates";
/** A run that hasn't finished in this long is taken to have died. */
const lockMinutes = 15;

interface Applied {
  at: Timestamp;
  summary: string;
  changed: number;
  notes: string[];
}

export interface UpdateRow {
  id: string;
  title: string;
  appliedAt: string | null;
  report: UpdateReport | null;
}

async function appliedIds(): Promise<Record<string, Applied>> {
  const data = (await getFirestore().doc(stateDoc).get()).data();
  return (data?.applied ?? {}) as Record<string, Applied>;
}

/** Takes the lock, or says someone else holds it. */
async function lock(): Promise<boolean> {
  const db = getFirestore();
  return db.runTransaction(async (transaction) => {
    const ref = db.doc(stateDoc);
    const running = (await transaction.get(ref)).data()?.runningSince as
      Timestamp | undefined;
    if (running && Date.now() - running.toMillis() < lockMinutes * 60_000)
      return false;
    transaction.set(
      ref,
      { runningSince: FieldValue.serverTimestamp() },
      { merge: true },
    );
    return true;
  });
}

const unlock = () =>
  getFirestore()
    .doc(stateDoc)
    .set({ runningSince: FieldValue.delete() }, { merge: true });

/** Applies the pending updates in order; gives back what each did. */
export async function applyPending(): Promise<UpdateRow[]> {
  const applied = await appliedIds();
  const pending = platformUpdates.filter((update) => !applied[update.id]);
  if (pending.length === 0) return [];
  if (!(await lock())) return [];
  const db = getFirestore();
  const done: UpdateRow[] = [];
  try {
    for (const update of pending) {
      const report = await update.run({ db, dryRun: false, now: new Date() });
      await db.doc(stateDoc).set(
        {
          applied: {
            [update.id]: {
              at: FieldValue.serverTimestamp(),
              ...report,
            },
          },
        },
        { merge: true },
      );
      logger.info("Platform update applied", { id: update.id, ...report });
      done.push({
        id: update.id,
        title: update.title,
        appliedAt: new Date().toISOString(),
        report,
      });
    }
  } catch (error) {
    logger.error("Platform update failed", error);
    await db
      .doc(stateDoc)
      .set(
        {
          lastError: String(error).slice(0, 500),
          lastErrorAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    throw error;
  } finally {
    await unlock();
  }
  return done;
}

/** Every update with whether it ran; pending ones with what they would do. */
export async function checkUpdates(): Promise<UpdateRow[]> {
  const applied = await appliedIds();
  const db = getFirestore();
  const rows: UpdateRow[] = [];
  for (const update of platformUpdates) {
    const ran = applied[update.id];
    rows.push({
      id: update.id,
      title: update.title,
      appliedAt: ran ? ran.at.toDate().toISOString() : null,
      report: ran
        ? { summary: ran.summary, changed: ran.changed, notes: ran.notes ?? [] }
        : await update.run({ db, dryRun: true, now: new Date() }),
    });
  }
  return rows;
}

/** Shortly after a deploy, whatever's pending runs. */
export const applyPlatformUpdates = onSchedule(
  { schedule: "every 10 minutes", timeoutSeconds: 540 },
  async () => {
    await applyPending();
  },
);

/** Settings › General: check (report only) or apply now. Administrators only. */
export const platformUpdatesNow = onCall(
  { timeoutSeconds: 540 },
  async (request) => {
    const actor = await requireActor(getFirestore(), request.auth?.uid);
    requireAllowed(actor, { action: "settings.admin" });
    if (request.data?.action === "apply") await applyPending();
    return { updates: await checkUpdates() };
  },
);

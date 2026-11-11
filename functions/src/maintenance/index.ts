// File : /TeamSamsara.Workflow/functions/src/maintenance/index.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The weekly check-up (Sundays at 4 AM Toronto time) and Run now
// for Administrators. Each run looks for data pointing at deleted things and
// for storage files nothing uses, saves a report in maintenanceRuns, and
// fixes them only when an Administrator has turned on Apply
// (config/maintenance). Until then it only reports.

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions/v2";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { applyFixes, readSnapshot } from "./applyFixes.js";
import { findOrphanFiles, type StoredFile } from "./findOrphanFiles.js";
import { defaultLimits, findOrphans, summarize } from "./findOrphans.js";

export {
  onEventSetDeleted,
  onMemberDeleted,
  onPeopleTagDeleted,
  onRepeatDeleted,
  onWorkGroupDeleted,
} from "./cascades.js";

async function storedFiles(): Promise<StoredFile[]> {
  const bucket = getStorage().bucket();
  const lists = await Promise.all(
    ["members/", "signin/"].map((prefix) => bucket.getFiles({ prefix })),
  );
  return lists.flatMap(([files]) =>
    files.map((file) => ({
      name: file.name,
      updated: new Date(String(file.metadata.updated ?? file.metadata.timeCreated ?? 0)),
    })),
  );
}

async function referencedUrls(): Promise<string[]> {
  const db = getFirestore();
  const members = await db.collection("members").get();
  const signin = (await db.doc("config/signin").get()).data();
  const slides = Array.isArray(signin?.slides) ? signin.slides : [];
  return [
    ...members.docs.flatMap((doc) => {
      const url = doc.data().photoUrl;
      return typeof url === "string" ? [url] : [];
    }),
    ...slides.flatMap((slide: { url?: unknown }) =>
      typeof slide?.url === "string" ? [slide.url] : [],
    ),
  ];
}

async function runCheckUp(trigger: "weekly" | "manual", byId: string | null) {
  const db = getFirestore();
  const now = new Date();
  const apply = (await db.doc("config/maintenance").get()).data()?.apply === true;
  const fixes = findOrphans(await readSnapshot(db), defaultLimits(now));
  let files: StoredFile[] = [];
  try {
    files = findOrphanFiles(await storedFiles(), await referencedUrls(), now);
  } catch (error) {
    // Storage may not be set up (or emulated); the database check still runs.
    logger.warn("Storage not checked", { error: String(error) });
  }
  const summary = summarize(fixes);
  if (apply) {
    await applyFixes(db, fixes);
    const bucket = files.length ? getStorage().bucket() : null;
    for (const file of files) await bucket?.file(file.name).delete({ ignoreNotFound: true });
  }
  const report = {
    at: FieldValue.serverTimestamp(),
    trigger,
    byId,
    mode: apply ? "apply" : "report",
    total: fixes.length,
    counts: summary.counts,
    examples: summary.examples,
    files: { count: files.length, examples: files.slice(0, 5).map((file) => file.name) },
  };
  const saved = await db.collection("maintenanceRuns").add(report);
  logger.info("Check-up done", { id: saved.id, mode: report.mode, total: fixes.length, files: files.length });
  return { id: saved.id, mode: report.mode, total: fixes.length, files: files.length };
}

export const weeklyCleanup = onSchedule(
  { schedule: "every sunday 04:00", timeZone: "America/Toronto" },
  async () => {
    await runCheckUp("weekly", null);
  },
);

/** Run now, for Administrators. */
export const runCleanup = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");
  const db = getFirestore();
  const member = (await db.doc(`members/${uid}`).get()).data();
  const grants = ((await db.doc("config/roles").get()).data()?.grants ?? {}) as Record<string, unknown>;
  const admins = new Set(Array.isArray(grants.administrator) ? grants.administrator : []);
  const roles: unknown[] = Array.isArray(member?.roleIds) ? member.roleIds : [];
  if (member?.status !== "active" || ![...roles, "everyone"].some((role) => admins.has(role)))
    throw new HttpsError("permission-denied", "Only Administrators can run the check-up.");
  return runCheckUp("manual", uid);
});

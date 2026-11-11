// File : /TeamSamsara.Workflow/app/src/features/maintenance/service/maintenanceService.ts
// Version : 1.1.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The database check-up from the app: run it now (on the server,
// for Administrators) and turn Apply on or off.

import { doc, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { Collections, serverTime } from "@/core/data";
import { db, functions } from "@/lib/firebase";

export interface RunResult {
  id: string;
  mode: "report" | "apply";
  total: number;
  files: number;
}

export async function runCheckUp(): Promise<RunResult> {
  const call = httpsCallable<void, RunResult>(functions, "runCleanup");
  return (await call()).data;
}

export function setApply(apply: boolean): Promise<void> {
  return setDoc(doc(db, Collections.config, "maintenance"), {
    apply,
    updatedAt: serverTime(),
  });
}

export interface UpdateRow {
  id: string;
  title: string;
  /** When it ran, as an ISO date; null while it's pending. */
  appliedAt: string | null;
  /** What it did, or (pending) what it would do. */
  report: { summary: string; changed: number; notes: string[] } | null;
}

/** Platform updates: each one, run or pending, with what it did or would do. */
export async function platformUpdates(
  action: "check" | "apply",
): Promise<UpdateRow[]> {
  const call = httpsCallable<
    { action: "check" | "apply" },
    { updates: UpdateRow[] }
  >(functions, "platformUpdatesNow", { timeout: 540_000 });
  return (await call({ action })).data.updates;
}

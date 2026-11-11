// File : /TeamSamsara.Workflow/app/src/features/maintenance/service/maintenanceService.ts
// Version : 1.0.0
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

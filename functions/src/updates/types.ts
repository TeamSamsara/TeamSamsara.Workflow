// File : /TeamSamsara.Workflow/functions/src/updates/types.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : What a platform update is: a one-time change to the data stored,
// shipped with the code that needs it, with an id that orders it and says
// when it was written. Each one can run in report-only mode first, and is
// safe to run twice.

import type { Firestore } from "firebase-admin/firestore";

export interface UpdateContext {
  db: Firestore;
  /** Only work out what would change. */
  dryRun: boolean;
  now: Date;
}

export interface UpdateReport {
  /** One line: what it did, or would do. */
  summary: string;
  /** How many documents it changed (or would). */
  changed: number;
  /** Things worth a look, like tasks kept because someone changed them. */
  notes: string[];
}

export interface PlatformUpdate {
  /** "2026-11-11-tasks-follow-workflows": the date first, so they sort. */
  id: string;
  /** What it does, in a sentence people read in Settings. */
  title: string;
  run: (context: UpdateContext) => Promise<UpdateReport>;
}

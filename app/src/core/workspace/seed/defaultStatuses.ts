// File : /TeamSamsara.Workflow/app/src/core/workspace/seed/defaultStatuses.ts
// Version : 1.0.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : The statuses a new workspace starts with: To do, In review,
// Approved, Done and Skipped. Statuses are the one list that can't start
// empty, because the app needs somewhere for tasks to start and finish; the
// workspace renames, recolours, reorders or replaces them as it likes. Data
// only, with type-only imports, so scripts/seedEmulator.mjs can load it as is.
// Event types and tags start empty: each workspace makes its own.

import type { StatusRecord } from "@/core/data";

export const defaultStatuses: readonly Omit<StatusRecord, "id">[] = [
  { name: "To do", tone: "neutral", category: "open", position: 0 },
  {
    name: "In review",
    tone: "info",
    category: "awaitingApproval",
    position: 1,
  },
  { name: "Approved", tone: "alert", category: "open", position: 2 },
  { name: "Done", tone: "success", category: "finished", position: 3 },
  { name: "Skipped", tone: "muted", category: "closed", position: 4 },
];

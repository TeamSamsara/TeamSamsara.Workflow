// File : /TeamSamsara.Workflow/app/src/views/workflows/importedWorkflow.ts
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : What the Workflows page hands the editor after an import: the
// workflow to start from, and how many references were left out.

import type { WorkflowFields } from "@/features/workflows";

export interface ImportedWorkflow {
  imported: WorkflowFields;
  dropped: number;
}

export function readImportedWorkflow(state: unknown): ImportedWorkflow | null {
  if (typeof state !== "object" || state === null) return null;
  const candidate = state as Partial<ImportedWorkflow>;
  return candidate.imported && typeof candidate.dropped === "number"
    ? { imported: candidate.imported, dropped: candidate.dropped }
    : null;
}

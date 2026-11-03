// File : /TeamSamsara.Workflow/app/src/views/workflows/importedWorkflow.ts
// Version : 1.1.0
// Latest commit: feature/workflow-guide
// Author : Gerrah
// Purpose : What other pages hand the editor: after an import, the workflow
// to start from and how many references were left out; after the guide, a
// note to say what to do next.

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

/** What the guide hands the editor after creating a workflow. */
export interface CreatedFromGuide {
  fromGuide: true;
}

export function cameFromGuide(state: unknown): boolean {
  return (
    typeof state === "object" &&
    state !== null &&
    (state as Partial<CreatedFromGuide>).fromGuide === true
  );
}

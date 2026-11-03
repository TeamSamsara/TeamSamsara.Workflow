// File : /TeamSamsara.Workflow/app/src/features/workflows/model/localId.ts
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : Short ids for things inside a workflow (steps, checklist items),
// unique within it.

export function localId(): string {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 12);
}

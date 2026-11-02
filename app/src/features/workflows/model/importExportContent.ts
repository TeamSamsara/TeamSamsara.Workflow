// File : /TeamSamsara.Workflow/app/src/features/workflows/model/importExportContent.ts
// Version : 1.1.0
// Latest commit: chore/rename-playbook
// Author : Gerrah
// Purpose : What an import says when a file can't be used.

export const ImportText = {
  notJson: "That file isn't a workflow: it couldn't be read.",
  notWorkflow: "That file isn't a workflow exported from Playbook.",
  newerVersion: "That workflow comes from a newer version of the app.",
  untitled: "Imported workflow",
} as const;

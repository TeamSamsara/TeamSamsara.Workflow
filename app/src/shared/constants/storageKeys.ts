// File : /TeamSamsara.Workflow/app/src/shared/constants/storageKeys.ts
// Version : 1.2.0
// Latest commit: fix/workflow-editor-simpler
// Author : Gerrah
// Purpose : The names of everything the app keeps in the browser's storage.

export const StorageKeys = {
  /** The person's light, dark or device choice. index.html reads it too, before React starts. */
  theme: "workflow.theme",
  /** The workspace's default theme, remembered so index.html can show it before the workspace loads. */
  themeDefault: "workflow.themeDefault",
  /** The person closed the "How workflows work" card. */
  workflowsIntroDismissed: "workflow.intro.workflows",
} as const;

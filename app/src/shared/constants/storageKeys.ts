// File : /TeamSamsara.Workflow/app/src/shared/constants/storageKeys.ts
// Version : 1.3.0
// Latest commit: feature/workflow-guide
// Author : Gerrah
// Purpose : The names of everything the app keeps in the browser's storage.

export const StorageKeys = {
  /** The person's light, dark or device choice. index.html reads it too, before React starts. */
  theme: "workflow.theme",
  /** The workspace's default theme, remembered so index.html can show it before the workspace loads. */
  themeDefault: "workflow.themeDefault",
  /** The person has been through (or closed) the workflows tutorial. */
  workflowsTutorialSeen: "workflow.tutorial.workflows",
} as const;

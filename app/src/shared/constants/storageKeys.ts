// File : /TeamSamsara.Workflow/app/src/shared/constants/storageKeys.ts
// Version : 1.1.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : The names of everything the app keeps in the browser's storage.

export const StorageKeys = {
  /** The person's light, dark or device choice. index.html reads it too, before React starts. */
  theme: "workflow.theme",
  /** The workspace's default theme, remembered so index.html can show it before the workspace loads. */
  themeDefault: "workflow.themeDefault",
} as const;

// File : /TeamSamsara.Workflow/app/src/shared/constants/storageKeys.ts
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : The names of everything the app keeps in the browser's storage.

export const StorageKeys = {
  /** The person's light, dark or device choice. index.html reads it too, before React starts. */
  theme: "workflow.theme",
} as const;

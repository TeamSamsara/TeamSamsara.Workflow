// File : /TeamSamsara.Workflow/app/src/core/workspace/workspaceContent.ts
// Version : 1.0.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : The words on the screens shown while the workspace loads, or when it
// can't be read.

export const WorkspaceText = {
  loading: "Opening your workspace",
  unavailableTitle: "Can't open the workspace",
  unavailableBody:
    "Workflow couldn't load your workspace. Check your connection, then try again.",
  tryAgain: "Try again",
} as const;

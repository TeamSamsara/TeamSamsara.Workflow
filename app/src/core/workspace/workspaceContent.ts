// File : /TeamSamsara.Workflow/app/src/core/workspace/workspaceContent.ts
// Version : 1.1.0
// Latest commit: feature/your-account
// Author : Gerrah
// Purpose : The words on the screens shown while the workspace loads, or when it
// can't be read.

export const WorkspaceText = {
  loading: "Opening your workspace",
  unavailableTitle: "Can't open the workspace",
  unavailableBody:
    "Workflow couldn't load your workspace. Check your connection, then try again.",
  tryAgain: "Try again",
  plannedZone: (workspace: string, own: string) =>
    `Times here are in ${workspace} time, the workspace's. Everywhere else you see them in ${own} time.`,
} as const;

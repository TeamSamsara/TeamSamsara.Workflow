// File : /TeamSamsara.Workflow/app/src/core/workspace/WorkspaceContext.ts
// Version : 1.0.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : The context that shares the workspace loaded by WorkspaceProvider.
// Context only; the hook that reads it is useWorkspace.

import { createContext } from "react";
import type { WorkspaceState } from "./workspaceTypes";

export const WorkspaceContext = createContext<WorkspaceState | undefined>(
  undefined,
);

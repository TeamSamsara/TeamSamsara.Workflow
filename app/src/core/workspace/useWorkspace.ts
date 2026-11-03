// File : /TeamSamsara.Workflow/app/src/core/workspace/useWorkspace.ts
// Version : 1.0.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : Reads WorkspaceContext, and fails loudly when used outside
// WorkspaceProvider. useWorkspaceRecord is for pages behind RequireWorkspace,
// where the workspace is always there.

import { useContext } from "react";
import type { WorkspaceRecord } from "@/core/data";
import { DevInvariants } from "@/lib/devInvariants";
import { WorkspaceContext } from "./WorkspaceContext";
import type { WorkspaceState } from "./workspaceTypes";

export function useWorkspace(): WorkspaceState {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error(DevInvariants.useWorkspaceOutsideProvider);
  }
  return context;
}

/** The workspace, for pages that RequireWorkspace already let through. */
export function useWorkspaceRecord(): WorkspaceRecord {
  const state = useWorkspace();
  if (state.status !== "ready") {
    throw new Error(DevInvariants.useWorkspaceRecordBeforeReady);
  }
  return state.workspace;
}

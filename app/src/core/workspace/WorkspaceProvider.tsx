// File : /TeamSamsara.Workflow/app/src/core/workspace/WorkspaceProvider.tsx
// Version : 1.0.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : Loads the workspace once for the whole app and keeps it current. It
// works signed out too, because the app must know whether to open setup before
// anyone can sign in.

import { useMemo, type ReactNode } from "react";
import { ConfigDocuments, useLiveSubscription } from "@/core/data";
import { WorkspaceContext } from "./WorkspaceContext";
import { listenToWorkspace } from "./workspaceService";
import type { WorkspaceState } from "./workspaceTypes";

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const result = useLiveSubscription(
    ConfigDocuments.workspace,
    listenToWorkspace,
  );

  const state = useMemo<WorkspaceState>(() => {
    switch (result.status) {
      case "idle":
      case "loading":
        return { status: "loading" };
      case "error":
        return { status: "error", error: result.error ?? "unknown" };
      case "ready":
        return result.data
          ? { status: "ready", workspace: result.data }
          : { status: "missing" };
    }
  }, [result]);

  return <WorkspaceContext value={state}>{children}</WorkspaceContext>;
}

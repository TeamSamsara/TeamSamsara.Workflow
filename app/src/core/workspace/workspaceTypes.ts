// File : /TeamSamsara.Workflow/app/src/core/workspace/workspaceTypes.ts
// Version : 1.0.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : The workspace as the app sees it: still loading, not set up yet,
// ready with its settings, or unreadable.

import type { DataErrorKind, WorkspaceRecord } from "@/core/data";

/** The settings a person can change (everything but when it was created). */
export type WorkspaceSettings = Omit<WorkspaceRecord, "createdAt">;

/**
 * loading: waiting for the first answer from the server.
 * missing: there is no workspace yet, so the app sends everyone to setup.
 * ready: the workspace exists and stays current.
 * error: it could not be read (offline on a first visit, for example).
 */
export type WorkspaceState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "ready"; workspace: WorkspaceRecord }
  | { status: "error"; error: DataErrorKind };

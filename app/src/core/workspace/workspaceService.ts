// File : /TeamSamsara.Workflow/app/src/core/workspace/workspaceService.ts
// Version : 1.1.0
// Latest commit: feature/workspace-settings
// Author : Gerrah
// Purpose : Reads the workspace record live, and saves changes to its settings.

import {
  doc,
  onSnapshot,
  updateDoc,
  type FieldValue,
  type Unsubscribe,
} from "firebase/firestore";
import {
  Collections,
  ConfigDocuments,
  workspaceConverter,
  type WorkspaceRecord,
} from "@/core/data";
import { db } from "@/lib/firebase";
import type { WorkspaceSettings } from "./workspaceTypes";

export function workspaceRef() {
  return doc(db, Collections.config, ConfigDocuments.workspace);
}

/**
 * Calls onData with the workspace, or null when there is none. A "missing"
 * answer that only came from the browser's copy is skipped, so a new device
 * never flashes the setup page before the server answers.
 */
export function listenToWorkspace(
  onData: (workspace: WorkspaceRecord | null) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    workspaceRef().withConverter(workspaceConverter),
    (snapshot) => {
      if (!snapshot.exists() && snapshot.metadata.fromCache) return;
      onData(snapshot.exists() ? snapshot.data() : null);
    },
    onError,
  );
}

/** Settings to change; a list may be changed in place (arrayUnion, arrayRemove). */
export type WorkspaceChanges = {
  [Key in keyof WorkspaceSettings]?: WorkspaceSettings[Key] | FieldValue;
};

/** Saves some of the settings. Needs the Manage settings permission. */
export function updateWorkspace(changes: WorkspaceChanges): Promise<void> {
  return updateDoc(workspaceRef(), changes);
}

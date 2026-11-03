// File : /TeamSamsara.Workflow/app/src/features/workflows/hooks/useWorkflows.ts
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : Every workflow, live, sorted by name; and one of them by id.

import { useMemo } from "react";
import { collection } from "firebase/firestore";
import { usePermissions } from "@/core/access";
import {
  Collections,
  useLiveCollection,
  type DataErrorKind,
} from "@/core/data";
import { workflowConverter, type WorkflowRecord } from "../types/workflowTypes";

export interface WorkflowList {
  status: "loading" | "ready" | "error";
  items: WorkflowRecord[];
  error: DataErrorKind | null;
}

export function useWorkflows(): WorkflowList {
  const isReady = usePermissions().status === "ready";
  const result = useLiveCollection(
    isReady ? "workflows:all" : null,
    (database) =>
      collection(database, Collections.workflows).withConverter(
        workflowConverter,
      ),
  );
  return useMemo<WorkflowList>(() => {
    if (result.status === "error") {
      return { status: "error", items: [], error: result.error };
    }
    if (result.status !== "ready") {
      return { status: "loading", items: [], error: null };
    }
    const items = [...(result.data ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    return { status: "ready", items, error: null };
  }, [result]);
}

/** undefined while loading, null when there's no such workflow. */
export function useWorkflow(
  workflowId: string | undefined,
): WorkflowRecord | null | undefined {
  const list = useWorkflows();
  if (list.status === "loading") return undefined;
  return list.items.find((workflow) => workflow.id === workflowId) ?? null;
}

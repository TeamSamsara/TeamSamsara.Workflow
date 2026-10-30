// File : /TeamSamsara.Workflow/app/src/features/workflows/hooks/useWorkflowDraft.ts
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : The editor's unsaved copy of a workflow (or a new one), whether it
// differs from what's saved, what needs fixing, and Save. After a save the
// draft follows the stored workflow again.

import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { dataErrorMessage } from "@/core/data";
import { checkWorkflow, type WorkflowProblems } from "../model/workflowChecks";
import {
  emptyWorkflow,
  sameWorkflow,
  tidyWorkflow,
} from "../model/workflowDraft";
import { createWorkflow, saveWorkflow } from "../service/workflowService";
import type { WorkflowFields, WorkflowRecord } from "../types/workflowTypes";

interface Edits {
  /** The workflow these edits belong to; null for a new one. */
  workflowId: string | null;
  fields: WorkflowFields;
  /** Saved and waiting for the stored copy to catch up. */
  committed: boolean;
}

export interface WorkflowDraft {
  fields: WorkflowFields;
  isDirty: boolean;
  problems: WorkflowProblems;
  change: (changes: Partial<WorkflowFields>) => void;
  /** Changes the steps from the latest version, for edits made in a row. */
  changeSteps: (
    update: (steps: WorkflowFields["steps"]) => WorkflowFields["steps"],
  ) => void;
  reset: () => void;
  /** Saves; for a new workflow, onSaved gets its id. */
  save: (onSaved?: (workflowId: string) => void) => void;
  isSaving: boolean;
  saveError: string | null;
}

function fieldsOf(workflow: WorkflowRecord): WorkflowFields {
  return {
    name: workflow.name,
    description: workflow.description,
    eventTypeId: workflow.eventTypeId,
    steps: workflow.steps,
  };
}

/**
 * @param workflow The stored workflow, or null for a new one.
 * @param start What a new workflow starts from (e.g. an import).
 */
export function useWorkflowDraft(
  workflow: WorkflowRecord | null,
  start: WorkflowFields = emptyWorkflow,
): WorkflowDraft {
  const workflowId = workflow?.id ?? null;
  const saved = useMemo(
    () => (workflow ? fieldsOf(workflow) : start),
    [workflow, start],
  );
  const [edits, setEdits] = useState<Edits | null>(null);

  if (
    edits?.committed &&
    edits.workflowId === workflowId &&
    sameWorkflow(tidyWorkflow(edits.fields), saved)
  ) {
    setEdits(null);
  }

  const fields =
    edits && edits.workflowId === workflowId ? edits.fields : saved;
  const problems = useMemo(() => checkWorkflow(fields), [fields]);
  const mutation = useMutation({
    mutationFn: async (next: WorkflowFields) =>
      workflowId === null
        ? createWorkflow(next)
        : saveWorkflow(workflowId, next).then(() => workflowId),
  });

  function update(next: WorkflowFields) {
    setEdits({ workflowId, fields: next, committed: false });
    if (mutation.error) mutation.reset();
  }

  return {
    fields,
    isDirty: !sameWorkflow(fields, saved),
    problems,
    change: (changes) => update({ ...fields, ...changes }),
    changeSteps: (change) => {
      setEdits((current) => {
        const base =
          current && current.workflowId === workflowId ? current.fields : saved;
        return {
          workflowId,
          fields: { ...base, steps: change(base.steps) },
          committed: false,
        };
      });
      if (mutation.error) mutation.reset();
    },
    reset: () => {
      setEdits(null);
      mutation.reset();
    },
    save: (onSaved) => {
      if (problems.count > 0) return;
      const toSave = tidyWorkflow(fields);
      mutation.mutate(toSave, {
        onSuccess: (savedId) => {
          // A new workflow's draft is done with; the page moves to the saved one.
          setEdits(
            workflowId === null
              ? null
              : { workflowId, fields: toSave, committed: true },
          );
          onSaved?.(savedId);
        },
      });
    },
    isSaving: mutation.isPending,
    saveError: mutation.error ? dataErrorMessage(mutation.error) : null,
  };
}

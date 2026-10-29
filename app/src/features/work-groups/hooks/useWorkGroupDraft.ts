// File : /TeamSamsara.Workflow/app/src/features/work-groups/hooks/useWorkGroupDraft.ts
// Version : 1.1.0
// Latest commit: fix/group-leads-and-x-premium
// Author : Gerrah
// Purpose : The unsaved edits to one work group: change the name, what it
// does, its leads or links, see whether anything changed, Reset, or Save. Follows the saved group
// while nothing is being edited, so changes by others show at once.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { dataErrorMessage } from "@/core/data";
import { checkName } from "@/shared/validation/nameRules";
import { linkHasErrors } from "../service/groupLeads";
import { saveWorkGroup } from "../service/workGroupService";
import type { WorkGroupFields, WorkGroupRecord } from "../types/workGroupTypes";

interface Edits {
  groupId: string;
  fields: WorkGroupFields;
  /** Saved already: kept only until the live group catches up with it. */
  committed: boolean;
}

const same = (a: WorkGroupFields, b: WorkGroupFields) =>
  JSON.stringify(a) === JSON.stringify(b);

export interface WorkGroupDraft {
  fields: WorkGroupFields;
  isDirty: boolean;
  nameError: string | undefined;
  /** A link without a name or a proper web address blocks saving. */
  hasLinkErrors: boolean;
  change: (changes: Partial<WorkGroupFields>) => void;
  reset: () => void;
  save: (onSaved?: () => void) => void;
  isSaving: boolean;
  saveError: string | null;
}

export function useWorkGroupDraft(group: WorkGroupRecord): WorkGroupDraft {
  const saved: WorkGroupFields = {
    name: group.name,
    description: group.description,
    leadIds: group.leadIds,
    links: group.links,
  };
  const [edits, setEdits] = useState<Edits | null>(null);

  // Once the live group shows what was saved, the edits are done with.
  if (edits?.committed && same(edits.fields, saved)) {
    setEdits(null);
  }

  const fields = edits && edits.groupId === group.id ? edits.fields : saved;
  const mutation = useMutation({
    mutationFn: (next: WorkGroupFields) => saveWorkGroup(group.id, next),
  });
  const nameError = checkName(fields.name);
  const hasLinkErrors = fields.links.some(linkHasErrors);

  return {
    fields,
    isDirty: !same(fields, saved),
    nameError,
    hasLinkErrors,
    change: (changes) => {
      setEdits({
        groupId: group.id,
        fields: { ...fields, ...changes },
        committed: false,
      });
      if (mutation.error) mutation.reset();
    },
    reset: () => {
      setEdits(null);
      mutation.reset();
    },
    save: (onSaved) => {
      if (nameError || hasLinkErrors) return;
      const toSave: WorkGroupFields = {
        name: fields.name.trim(),
        description: fields.description.trim(),
        leadIds: fields.leadIds,
        links: fields.links.map((link) => ({
          label: link.label.trim(),
          url: link.url.trim(),
        })),
      };
      mutation.mutate(toSave, {
        onSuccess: () => {
          setEdits({ groupId: group.id, fields: toSave, committed: true });
          onSaved?.();
        },
      });
    },
    isSaving: mutation.isPending,
    saveError: mutation.error ? dataErrorMessage(mutation.error) : null,
  };
}

// File : /TeamSamsara.Workflow/app/src/features/roles/hooks/useRoleDraft.ts
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : The unsaved edits to one role, shared by its Display and
// Permissions tabs: change fields, see whether anything changed, Reset back to
// the saved role, or Save. Opening another role starts a fresh draft.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { PermissionKey } from "@/core/access";
import { dataErrorMessage, type RoleRecord } from "@/core/data";
import { checkName } from "@/shared/validation/nameRules";
import { tidyPermissions } from "../service/roleChanges";
import { saveRole } from "../service/roleService";
import type { RoleFields } from "../types/roleTypes";

function fieldsOf(role: RoleRecord): RoleFields {
  return {
    name: role.name,
    color: role.color,
    description: role.description,
    permissions: tidyPermissions(role.permissions),
  };
}

function sameFields(a: RoleFields, b: RoleFields): boolean {
  return (
    a.name === b.name &&
    a.color === b.color &&
    a.description === b.description &&
    a.permissions.join() === b.permissions.join()
  );
}

export interface RoleDraft {
  fields: RoleFields;
  isDirty: boolean;
  nameError: string | undefined;
  change: (changes: Partial<Omit<RoleFields, "permissions">>) => void;
  setPermission: (permission: PermissionKey, on: boolean) => void;
  clearPermissions: (keep?: (permission: PermissionKey) => boolean) => void;
  reset: () => void;
  /** Saves the draft; onSaved runs once the server has it. */
  save: (onSaved?: () => void) => void;
  isSaving: boolean;
  saveError: string | null;
}

interface Edits {
  roleId: string;
  fields: RoleFields;
  /** Saved already: kept only until the live role catches up with it. */
  committed: boolean;
}

export function useRoleDraft(role: RoleRecord): RoleDraft {
  const saved = fieldsOf(role);
  const [edits, setEdits] = useState<Edits | null>(null);

  // Once the live role shows what was saved, the edits are done with. (Set during
  // render, React's pattern for state that follows other values.)
  if (edits?.committed && sameFields(edits.fields, saved)) {
    setEdits(null);
  }

  // Edits belong to one role; another role starts from what is saved.
  const fields = edits && edits.roleId === role.id ? edits.fields : saved;

  const mutation = useMutation({
    mutationFn: (next: RoleFields) => saveRole(role.id, next),
  });

  function update(next: RoleFields) {
    setEdits({ roleId: role.id, fields: next, committed: false });
    if (mutation.error) mutation.reset();
  }

  const nameError = checkName(fields.name);

  return {
    fields,
    isDirty: !sameFields(fields, saved),
    nameError,
    change: (changes) => update({ ...fields, ...changes }),
    setPermission: (permission, on) =>
      update({
        ...fields,
        permissions: tidyPermissions(
          on
            ? [...fields.permissions, permission]
            : fields.permissions.filter((key) => key !== permission),
        ),
      }),
    clearPermissions: (keep = () => false) =>
      update({ ...fields, permissions: fields.permissions.filter(keep) }),
    reset: () => {
      setEdits(null);
      mutation.reset();
    },
    save: (onSaved) => {
      if (nameError) return;
      // Trimmed as the save trims it, so the edits match the saved role after.
      const toSave = {
        ...fields,
        name: fields.name.trim(),
        description: fields.description.trim(),
      };
      mutation.mutate(toSave, {
        onSuccess: () => {
          setEdits({ roleId: role.id, fields: toSave, committed: true });
          onSaved?.();
        },
      });
    },
    isSaving: mutation.isPending,
    saveError: mutation.error ? dataErrorMessage(mutation.error) : null,
  };
}

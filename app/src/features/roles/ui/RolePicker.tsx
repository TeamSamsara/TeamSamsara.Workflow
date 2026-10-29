// File : /TeamSamsara.Workflow/app/src/features/roles/ui/RolePicker.tsx
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : A checkbox list of the roles you may give someone (below your own
// highest role, never Everyone), each with its colour dot. Used when inviting
// a member and when changing their roles.

import type { CSSProperties } from "react";
import type { RoleRecord } from "@/core/data";
import { Checkbox } from "@/shared/components/Fields/Checkbox/Checkbox";
import { RolePickerText } from "./roleListContent";
import styles from "./RolePicker.module.css";

interface RolePickerProps {
  /** The roles that may be given, top first (see assignableRoles). */
  roles: readonly RoleRecord[];
  selectedIds: readonly string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
}

export function RolePicker({
  roles,
  selectedIds,
  onChange,
  disabled = false,
}: RolePickerProps) {
  function toggle(roleId: string, on: boolean) {
    const next = on
      ? [...selectedIds, roleId]
      : selectedIds.filter((id) => id !== roleId);
    // Kept in the list's order, so saved records read top to bottom.
    onChange(roles.map((role) => role.id).filter((id) => next.includes(id)));
  }

  return (
    <fieldset className={styles.picker} disabled={disabled}>
      <legend className={styles.legend}>{RolePickerText.legend}</legend>
      {roles.length === 0 ? (
        <p className={styles.hint}>{RolePickerText.none}</p>
      ) : (
        <div className={styles.options}>
          {roles.map((role) => (
            <Checkbox
              key={role.id}
              checked={selectedIds.includes(role.id)}
              onChange={(event) => toggle(role.id, event.target.checked)}
              label={
                <span
                  className={styles.option}
                  style={{ "--role-color": role.color } as CSSProperties}
                >
                  <span className={styles.dot} aria-hidden="true" />
                  {role.name}
                </span>
              }
            />
          ))}
        </div>
      )}
      <p className={styles.hint}>{RolePickerText.hint}</p>
    </fieldset>
  );
}

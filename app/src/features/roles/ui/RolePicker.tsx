// File : /TeamSamsara.Workflow/app/src/features/roles/ui/RolePicker.tsx
// Version : 1.2.0
// Latest commit: fix/invite-and-fields
// Author : Gerrah
// Purpose : The roles you may give someone (below your own highest role,
// never Everyone) as one list, each row with the role's colour, what it gives
// and a switch. Used when inviting a member and when changing their roles.

import type { CSSProperties } from "react";
import { isPermissionKey, PermissionText } from "@/core/access";
import type { RoleRecord } from "@/core/data";
import { Switch } from "@/shared/components/Fields/Switch/Switch";
import { RolePickerText } from "./roleListContent";
import styles from "./RolePicker.module.css";

interface RolePickerProps {
  /** The roles that may be given, top first (see assignableRoles). */
  roles: readonly RoleRecord[];
  selectedIds: readonly string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
  /** Inside a card already titled "Roles": no visible legend or hint. */
  compact?: boolean;
}

/** The role's own description, or else what it lets them do. */
function roleSummary(role: RoleRecord): string {
  if (role.description.trim()) return role.description.trim();
  const keys = role.permissions.filter(isPermissionKey);
  if (keys.includes("administrator")) return RolePickerText.everything;
  if (keys.length === 0) return RolePickerText.nothingExtra;
  return RolePickerText.gives(keys.map((key) => PermissionText[key].label));
}

export function RolePicker({
  roles,
  selectedIds,
  onChange,
  disabled = false,
  compact = false,
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
      <legend className={compact ? styles.hiddenLegend : styles.legend}>
        {RolePickerText.legend}
      </legend>
      {roles.length === 0 ? (
        <p className={styles.hint}>{RolePickerText.none}</p>
      ) : (
        <div className={styles.list}>
          {roles.map((role) => {
            const on = selectedIds.includes(role.id);
            return (
              <div key={role.id} className={styles.row} data-on={on}>
                <Switch
                  className={styles.switchRow}
                  checked={on}
                  disabled={disabled}
                  onCheckedChange={(checked) => toggle(role.id, checked)}
                  label={
                    <span
                      className={styles.name}
                      style={{ "--role-color": role.color } as CSSProperties}
                    >
                      <span className={styles.dot} aria-hidden="true" />
                      {role.name}
                    </span>
                  }
                  description={roleSummary(role)}
                />
              </div>
            );
          })}
        </div>
      )}
      {compact ? null : <p className={styles.hint}>{RolePickerText.hint}</p>}
    </fieldset>
  );
}

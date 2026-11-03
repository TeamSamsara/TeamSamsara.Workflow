// File : /TeamSamsara.Workflow/app/src/features/roles/ui/PermissionList.tsx
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : A role's permissions as switches in their groups (General,
// Workspace, Planning, Tasks, Viewing), with a search box and Clear all.
// Switches the editor may not change are shown but locked. For Everyone it
// explains the role and leaves Administrator out.

import { useState } from "react";
import {
  NotForEveryone,
  PermissionGroups,
  PermissionGroupText,
  permissionsByGroup,
  PermissionText,
  type PermissionKey,
} from "@/core/access";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Switch } from "@/shared/components/Fields/Switch/Switch";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { PermissionListText } from "./permissionListContent";
import styles from "./PermissionList.module.css";

interface PermissionListProps {
  selected: readonly PermissionKey[];
  onChange: (permission: PermissionKey, on: boolean) => void;
  onClearAll: () => void;
  /** Whether the editor may flip this one. */
  canChange: (permission: PermissionKey) => boolean;
  isEveryone: boolean;
  /** The whole role is out of the editor's reach. */
  readOnly?: boolean;
}

function matches(permission: PermissionKey, search: string): boolean {
  const { label, description } = PermissionText[permission];
  const wanted = search.trim().toLowerCase();
  return (
    !wanted ||
    label.toLowerCase().includes(wanted) ||
    description.toLowerCase().includes(wanted)
  );
}

export function PermissionList({
  selected,
  onChange,
  onClearAll,
  canChange,
  isEveryone,
  readOnly = false,
}: PermissionListProps) {
  const [search, setSearch] = useState("");

  const groups = PermissionGroups.map((group) => ({
    group,
    permissions: permissionsByGroup[group].filter(
      (permission) =>
        !(isEveryone && NotForEveryone.includes(permission)) &&
        matches(permission, search),
    ),
  })).filter((entry) => entry.permissions.length > 0);

  const someLocked =
    !readOnly &&
    PermissionGroups.some((group) =>
      permissionsByGroup[group].some((permission) => !canChange(permission)),
    );
  const anyClearable = selected.some((permission) => canChange(permission));

  return (
    <div className={styles.list}>
      {isEveryone ? (
        <Banner tone="info" icon="members">
          {PermissionListText.everyoneBanner}
        </Banner>
      ) : null}
      {readOnly ? (
        <Banner tone="alert" icon="lock">
          {PermissionListText.readOnly}
        </Banner>
      ) : someLocked ? (
        <p className={styles.note}>{PermissionListText.notYours}</p>
      ) : null}

      <div className={styles.toolbar}>
        <TextField
          label={PermissionListText.search}
          hideLabel
          type="search"
          leadingIcon="search"
          placeholder={PermissionListText.search}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={styles.search}
        />
        {readOnly ? null : (
          <Button variant="ghost" onClick={onClearAll} disabled={!anyClearable}>
            {PermissionListText.clearAll}
          </Button>
        )}
      </div>

      {groups.length === 0 ? (
        <p className={styles.note}>{PermissionListText.noResults(search)}</p>
      ) : (
        groups.map(({ group, permissions }) => (
          <section key={group} className={styles.group}>
            <h3 className={styles.groupTitle}>{PermissionGroupText[group]}</h3>
            <div className={styles.rows}>
              {permissions.map((permission) => (
                <Switch
                  key={permission}
                  label={PermissionText[permission].label}
                  description={PermissionText[permission].description}
                  checked={selected.includes(permission)}
                  onCheckedChange={(on) => onChange(permission, on)}
                  disabled={readOnly || !canChange(permission)}
                  className={styles.row}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

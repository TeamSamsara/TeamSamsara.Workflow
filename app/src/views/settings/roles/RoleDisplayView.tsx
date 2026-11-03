// File : /TeamSamsara.Workflow/app/src/views/settings/roles/RoleDisplayView.tsx
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : A role's Display tab: name, colour, description and preview, then
// Delete role (or why it can't be deleted). Everyone has no Display tab, so it
// goes to Permissions.

import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  deleteBlocker,
  DeleteRoleDialog,
  DeleteRoleText,
  RoleDisplayForm,
} from "@/features/roles";
import { Button } from "@/shared/components/Button/Button";
import { RoleTabs, RoutePaths, rolePath } from "@/shared/constants/routePaths";
import { useRoleEditor } from "./roleEditorContext";
import styles from "./RolesView.module.css";

export function RoleDisplayView() {
  const { item, draft, list } = useRoleEditor();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  if (item.isEveryone) {
    return (
      <Navigate to={rolePath(item.role.id, RoleTabs.permissions)} replace />
    );
  }

  const blocker = list.roles
    ? deleteBlocker(item.role, list.roles, list.editor)
    : "notManaged";

  return (
    <>
      <RoleDisplayForm
        fields={draft.fields}
        onChange={draft.change}
        nameError={draft.nameError}
        disabled={!item.canManage || draft.isSaving}
      />

      <hr className={styles.divider} />
      <div className={styles.dangerRow}>
        <div className={styles.dangerText}>
          <b>{DeleteRoleText.heading}</b>
          {blocker ? (
            <span className={styles.muted}>
              {DeleteRoleText.blocked[blocker]}
            </span>
          ) : null}
        </div>
        <Button
          variant="danger"
          iconStart="trash"
          disabled={Boolean(blocker)}
          onClick={() => setIsDeleting(true)}
        >
          {DeleteRoleText.button}
        </Button>
      </div>

      {isDeleting ? (
        <DeleteRoleDialog
          role={item.role}
          memberCount={item.memberCount}
          onClose={() => setIsDeleting(false)}
          onDeleted={() => {
            draft.reset();
            navigate(RoutePaths.settingsRoles, { replace: true });
          }}
        />
      ) : null}
    </>
  );
}

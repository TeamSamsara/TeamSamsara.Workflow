// File : /TeamSamsara.Workflow/app/src/features/roles/ui/roleDialogsContent.ts
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : The words in the New role and Delete role dialogs, and why a role
// can't be deleted.

import type { DeleteBlocker } from "../service/roleAccess";

export const NewRoleDialogText = {
  title: "New role",
  description:
    "It starts just above Everyone with no permissions. You can switch them on next.",
  name: "Role name",
  namePlaceholder: "Planner",
  cancel: "Cancel",
  create: "Create role",
  created: (name: string) => `${name} created`,
} as const;

/** What deleting does to members, said the same way on the tab and in the dialog. */
function deleteEffect(count: number | null): string {
  if (count === null) {
    return "Members with this role lose it. Nobody is removed from the workspace.";
  }
  if (count === 0) {
    return "Nobody has this role. Nobody is removed from the workspace.";
  }
  const who = count === 1 ? "1 member loses" : `${count} members lose`;
  return `${who} this role. Nobody is removed from the workspace.`;
}

export const DeleteRoleDialogText = {
  title: (name: string) => `Delete ${name}?`,
  body: deleteEffect,
  cannotUndo: "This can't be undone.",
  cancel: "Cancel",
  confirm: "Delete role",
  deleted: (name: string) => `${name} deleted`,
} as const;

export const DeleteRoleText = {
  heading: "Delete role",
  effect: deleteEffect,
  button: "Delete role",
  blocked: {
    everyone: "Everyone can't be deleted.",
    notManaged: "This role is at or above your own, so you can't delete it.",
    lastAdmin:
      "This is the only role with Administrator. Give Administrator to another role first.",
    permissions:
      "This role has permissions you don't have, so you can't delete it.",
  } satisfies Record<DeleteBlocker, string>,
} as const;

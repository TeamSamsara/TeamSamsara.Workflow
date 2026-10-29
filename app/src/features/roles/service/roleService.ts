// File : /TeamSamsara.Workflow/app/src/features/roles/service/roleService.ts
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : Saves role changes. Every change reads the roles document and
// writes it back in one transaction, so two people editing roles at once never
// undo each other's work, and the permission index is rebuilt in the same write.

import {
  collection,
  doc,
  runTransaction,
  type DocumentReference,
} from "firebase/firestore";
import {
  Collections,
  ConfigDocuments,
  rolesConverter,
  type RoleRecord,
  type RolesRecord,
} from "@/core/data";
import { db } from "@/lib/firebase";
import type { RoleFields } from "../types/roleTypes";
import { addRole, removeRole, reorderRoles, updateRole } from "./roleChanges";

function rolesRef(): DocumentReference<RolesRecord> {
  return doc(db, Collections.config, ConfigDocuments.roles).withConverter(
    rolesConverter,
  );
}

/** A fresh id that is never reused, so an old member record can't match a new role. */
function newRoleId(): string {
  return doc(collection(db, Collections.config)).id;
}

async function changeRoles(
  change: (roles: readonly RoleRecord[]) => RoleRecord[],
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(rolesRef());
    const current = snapshot.data()?.roles ?? [];
    // The converter rebuilds the grants index from the roles.
    transaction.set(rolesRef(), { roles: change(current), grants: {} });
  });
}

/** Adds a role above Everyone and gives back its id. */
export async function createRole(fields: RoleFields): Promise<string> {
  const id = newRoleId();
  await changeRoles((roles) => addRole(roles, id, fields));
  return id;
}

export function saveRole(id: string, fields: RoleFields): Promise<void> {
  return changeRoles((roles) => updateRole(roles, id, fields));
}

export function saveRoleOrder(orderedIds: readonly string[]): Promise<void> {
  return changeRoles((roles) => reorderRoles(roles, orderedIds));
}

/** Deletes the role. Members keep the id in their record, but it no longer grants anything. */
export function deleteRole(id: string): Promise<void> {
  return changeRoles((roles) => removeRole(roles, id));
}

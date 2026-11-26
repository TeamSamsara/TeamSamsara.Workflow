// File : /TeamSamsara.Workflow/app/src/features/roles/service/roleService.ts
// Version : 2.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Saves role changes through the server, which checks rank, rebuilds
// the permission index and records each change in the activity history.
// Giving and taking roles is a member change, also made by the server.

import { collection, doc, getDoc } from "firebase/firestore";
import { manage } from "@/core/access";
import {
  Collections,
  ConfigDocuments,
  parseRoles,
  type RoleRecord,
} from "@/core/data";
import { db } from "@/lib/firebase";
import type { RoleFields } from "../types/roleTypes";
import { addRole, removeRole, reorderRoles, updateRole } from "./roleChanges";

/** A fresh id that is never reused, so an old member record can't match a new role. */
function newRoleId(): string {
  return doc(collection(db, Collections.config)).id;
}

/**
 * Saves the whole set of roles through the server, which checks rank (only
 * roles strictly below yours) and refuses a save made from an older copy, so
 * two people editing roles at once never undo each other's work.
 */
async function changeRoles(
  change: (roles: readonly RoleRecord[]) => RoleRecord[],
): Promise<void> {
  const snapshot = await getDoc(
    doc(db, Collections.config, ConfigDocuments.roles),
  );
  const data = snapshot.data() ?? {};
  const version = typeof data.version === "number" ? data.version : 0;
  const current = parseRoles(snapshot.id, data).roles;
  await manage({
    op: "roles.save",
    version,
    roles: change(current).map((role) => ({
      id: role.id,
      name: role.name,
      color: role.color,
      description: role.description,
      position: role.position,
      permissions: [...new Set(role.permissions)],
    })),
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

/** Deletes the role; the server takes it off everyone who had it. */
export async function deleteRole(id: string): Promise<void> {
  await changeRoles((roles) => removeRole(roles, id));
}

/** A member's roles as they are now, to change one. */
async function rolesOf(memberId: string): Promise<string[]> {
  const snapshot = await getDoc(doc(db, Collections.members, memberId));
  const stored: unknown = snapshot.data()?.roleIds;
  return Array.isArray(stored)
    ? stored.filter((id): id is string => typeof id === "string")
    : [];
}

/** Gives the role to these members (from the role's Members tab). */
export function giveRole(
  roleId: string,
  memberIds: readonly string[],
): Promise<void[]> {
  return Promise.all(
    memberIds.map(async (memberId) => {
      const roleIds = await rolesOf(memberId);
      if (roleIds.includes(roleId)) return;
      await manage({
        op: "member.update",
        memberId,
        roleIds: [...roleIds, roleId],
      });
    }),
  );
}

/** Takes the role away from one member. */
export async function takeRole(
  roleId: string,
  memberId: string,
): Promise<void> {
  const roleIds = await rolesOf(memberId);
  await manage({
    op: "member.update",
    memberId,
    roleIds: roleIds.filter((id) => id !== roleId),
  });
}

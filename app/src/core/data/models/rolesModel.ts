// File : /TeamSamsara.Workflow/app/src/core/data/models/rolesModel.ts
// Version : 1.0.0
// Latest commit: core/data
// Author : Gerrah
// Purpose : The roles document (config/roles). It holds every role, and an index
// of which roles grant each permission, so a security rule can check a permission
// with one read. The index is rebuilt from the roles on every save, so the two
// can never disagree.

import type { DocumentData } from "firebase/firestore";
import { createConverter } from "../firestoreConverter";
import {
  readMap,
  readNumber,
  readString,
  readStringList,
} from "../fieldReaders";

/** The role every member has. It cannot be deleted and always sits at the bottom. */
export const EveryoneRoleId = "everyone";

export interface RoleRecord {
  id: string;
  name: string;
  /** Any CSS colour, picked by the person who made the role. */
  color: string;
  description: string;
  /** Higher numbers rank higher. Everyone is always 0. */
  position: number;
  /** Permission keys this role switches on. */
  permissions: string[];
}

export interface RolesRecord {
  /** Every role, highest position first. */
  roles: RoleRecord[];
  /** Permission key → ids of the roles that grant it. */
  grants: Record<string, string[]>;
}

/** Which roles grant each permission, with role ids in a stable order. */
export function buildPermissionGrants(
  roles: readonly RoleRecord[],
): Record<string, string[]> {
  const grants: Record<string, string[]> = {};
  const byId = [...roles].sort((a, b) => a.id.localeCompare(b.id));
  for (const role of byId) {
    for (const permission of new Set(role.permissions)) {
      (grants[permission] ??= []).push(role.id);
    }
  }
  return grants;
}

/** Highest position first; equal positions fall back to the name. */
export function sortRoles(roles: readonly RoleRecord[]): RoleRecord[] {
  return [...roles].sort(
    (a, b) => b.position - a.position || a.name.localeCompare(b.name),
  );
}

function parseRole(id: string, data: DocumentData): RoleRecord {
  return {
    id,
    name: readString(data, "name"),
    color: readString(data, "color"),
    description: readString(data, "description"),
    position: id === EveryoneRoleId ? 0 : readNumber(data, "position"),
    permissions: readStringList(data, "permissions"),
  };
}

function parse(_id: string, data: DocumentData): RolesRecord {
  const stored = readMap(data, "roles");
  const roles = Object.entries(stored).map(([roleId, roleData]) =>
    parseRole(roleId, readMap({ role: roleData }, "role")),
  );
  const storedGrants = readMap(data, "grants");
  const grants: Record<string, string[]> = {};
  for (const permission of Object.keys(storedGrants)) {
    grants[permission] = readStringList(storedGrants, permission);
  }
  return { roles: sortRoles(roles), grants };
}

function serialize(record: RolesRecord): DocumentData {
  const roles: DocumentData = {};
  for (const role of record.roles) {
    roles[role.id] = {
      name: role.name,
      color: role.color,
      description: role.description,
      position: role.id === EveryoneRoleId ? 0 : role.position,
      permissions: [...new Set(role.permissions)],
    };
  }
  return { roles, grants: buildPermissionGrants(record.roles) };
}

export const rolesConverter = createConverter({ parse, serialize });
export const parseRoles = parse;
export const serializeRoles = serialize;

// File : /TeamSamsara.Workflow/functions/src/access/readAccess.ts
// Version : 1.1.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Reads what permission checks need from the database: the roles
// (and writes them back with their permission index), members, groups, and
// who is acting. Every server check loads its actor here and asks the shared
// decide(), instead of each function checking permissions its own way.

import {
  Timestamp,
  type DocumentData,
  type Firestore,
} from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import {
  actorOf,
  decide,
  readAssign,
  type AccessRequest,
  type Actor,
  type MemberStatus,
} from "../../../engine/src/index.js";
import type { GroupEntry, MemberEntry, RoleEntry } from "./managePlan.js";

const text = (value: unknown): string =>
  typeof value === "string" ? value : "";
const list = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
const statuses: MemberStatus[] = ["active", "invited", "disabled", "removed"];

export function readRoles(data: DocumentData | undefined): RoleEntry[] {
  const stored = (data?.roles ?? {}) as Record<string, DocumentData>;
  return Object.entries(stored).map(([id, role]) => ({
    id,
    name: text(role.name),
    color: text(role.color),
    description: text(role.description),
    position:
      id === "everyone"
        ? 0
        : typeof role.position === "number"
          ? role.position
          : 0,
    permissions: list(role.permissions),
  }));
}

/** The roles document as the app reads it: the roles, and permission → role ids. */
export function writeRoles(roles: readonly RoleEntry[], version: number) {
  const map: Record<string, DocumentData> = {};
  const grants: Record<string, string[]> = {};
  for (const role of [...roles].sort((a, b) => a.id.localeCompare(b.id))) {
    const permissions = [...new Set(role.permissions)];
    map[role.id] = {
      name: role.name,
      color: role.color,
      description: role.description,
      position: role.id === "everyone" ? 0 : role.position,
      permissions,
    };
    for (const permission of permissions)
      (grants[permission] ??= []).push(role.id);
  }
  return { roles: map, grants, version };
}

export const rolesVersion = (data: DocumentData | undefined) =>
  typeof data?.version === "number" ? data.version : 0;

export function readMember(id: string, data: DocumentData): MemberEntry {
  const status = statuses.find((entry) => entry === data.status) ?? "removed";
  return {
    id,
    status,
    displayName: text(data.displayName),
    email: text(data.email),
    roleIds: list(data.roleIds),
    workGroupIds: list(data.workGroupIds),
    joinedAt:
      data.joinedAt instanceof Timestamp ? data.joinedAt.toDate() : null,
  };
}

export function readGroup(id: string, data: DocumentData): GroupEntry {
  return {
    id,
    name: text(data.name),
    leadIds: list(data.leadIds),
    assign: readAssign(data.assign),
  };
}

/** The groups a member leads, from the groups themselves. */
export async function leadOf(
  db: Firestore,
  memberId: string,
): Promise<string[]> {
  const snapshot = await db
    .collection("workGroups")
    .where("leadIds", "array-contains", memberId)
    .get();
  return snapshot.docs.map((doc) => doc.id);
}

/** Who is acting, or null when they have no member record. */
export async function loadActor(
  db: Firestore,
  memberId: string,
): Promise<Actor | null> {
  const [memberDoc, rolesDoc, leads] = await Promise.all([
    db.doc(`members/${memberId}`).get(),
    db.doc("config/roles").get(),
    leadOf(db, memberId),
  ]);
  if (!memberDoc.exists) return null;
  const member = readMember(memberId, memberDoc.data() ?? {});
  return actorOf(member, readRoles(rolesDoc.data()), leads);
}

/** For server calls: the signed-in actor, or a refusal the app can show. */
export async function requireActor(
  db: Firestore,
  uid: string | undefined,
): Promise<Actor> {
  if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");
  const actor = await loadActor(db, uid);
  if (!actor || (actor.status !== "active" && actor.status !== "invited"))
    throw new HttpsError("permission-denied", "noAccess");
  return actor;
}

/** Refuses with decide()'s reason unless the actor may. */
export function requireAllowed(actor: Actor, request: AccessRequest): void {
  const decision = decide(actor, request);
  if (!decision.ok) throw new HttpsError("permission-denied", decision.reason);
}

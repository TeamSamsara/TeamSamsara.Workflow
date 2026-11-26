// File : /TeamSamsara.Workflow/functions/src/updates/ownersAndRanks.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : The platform update that brings a workspace onto the permission
// model: the Owner role (given to the person who set the workspace up), roles
// at distinct positions in the order people see, rank and leadOf on every
// member, every lead inside their group (an overseer: not handed tasks), and
// open tasks handed back from people turned off or removed. Nothing is
// deleted; finished work and approvals stay as they are. Safe to run twice.

import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import { OwnerRank, OwnerRoleId, rankOf } from "../../../engine/src/index.js";
import type { RoleEntry } from "../access/managePlan.js";
import { readRoles, rolesVersion, writeRoles } from "../access/readAccess.js";
import type { PlatformUpdate } from "./types.js";

export interface MemberForUpdate {
  id: string;
  name: string;
  status: string;
  roleIds: string[];
  workGroupIds: string[];
  invitedBy: string | null;
  joinedAt: number | null;
  rank: number | null;
  leadOf: string[] | null;
}

export interface GroupForUpdate {
  id: string;
  leadIds: string[];
  /** Who doesn't take the group's tasks; null when it has no assignment settings yet. */
  skip: string[] | null;
}

export interface OwnersAndRanksPlan {
  roles: RoleEntry[] | null;
  ownerId: string | null;
  members: Record<string, Record<string, unknown>>;
  groups: Record<string, Record<string, unknown>>;
  /** Open tasks to take back from people turned off or removed. */
  tasks: string[];
  notes: string[];
}

export const ownerRole: RoleEntry = {
  id: OwnerRoleId,
  name: "Owner",
  color: "#151D23",
  description: "Above every other role. Only Owners make someone an Owner.",
  position: OwnerRank,
  permissions: ["administrator"],
};

/** Highest first, then by name: the order the roles page shows. */
const shown = (roles: readonly RoleEntry[]) =>
  [...roles].sort(
    (a, b) => b.position - a.position || a.name.localeCompare(b.name),
  );

/** Roles at distinct positions, in the order people see them; null when they already are. */
function distinctPositions(roles: readonly RoleEntry[]): RoleEntry[] | null {
  const ranked = roles.filter(
    (role) => role.id !== "everyone" && role.id !== OwnerRoleId,
  );
  const positions = ranked.map((role) => role.position);
  if (
    new Set(positions).size === positions.length &&
    positions.every((p) => p > 0)
  )
    return null;
  const ordered = shown(ranked);
  return ordered.map((role, index) => ({
    ...role,
    position: ordered.length - index,
  }));
}

const sameList = (a: readonly string[] | null, b: readonly string[]) =>
  a !== null && a.length === b.length && a.every((entry) => b.includes(entry));

export function planOwnersAndRanks(
  rolesIn: readonly RoleEntry[],
  members: readonly MemberForUpdate[],
  groups: readonly GroupForUpdate[],
  openTasks: readonly { id: string; memberId: string; inReview: boolean }[],
): OwnersAndRanksPlan {
  const plan: OwnersAndRanksPlan = {
    roles: null,
    ownerId: null,
    members: {},
    groups: {},
    tasks: [],
    notes: [],
  };
  const set = (id: string, change: Record<string, unknown>) => {
    plan.members[id] = { ...plan.members[id], ...change };
  };

  // 1-2. The Owner role, and roles at distinct positions.
  let roles = [...rolesIn];
  const renumbered = distinctPositions(roles);
  if (renumbered) {
    roles = [
      ...roles.filter(
        (role) => role.id === "everyone" || role.id === OwnerRoleId,
      ),
      ...renumbered,
    ];
    plan.notes.push(
      "Roles that shared a position now each have their own, in the same order.",
    );
  }
  const hasOwnerRole = roles.some((role) => role.id === OwnerRoleId);
  if (!hasOwnerRole) roles = [...roles, ownerRole];
  if (renumbered || !hasOwnerRole) plan.roles = roles;

  const adminRoles = new Set(
    roles
      .filter((role) => role.permissions.includes("administrator"))
      .map((role) => role.id),
  );
  const current = members.filter((member) => member.status !== "removed");
  if (!current.some((member) => member.roleIds.includes(OwnerRoleId))) {
    const admins = current
      .filter(
        (member) =>
          member.status === "active" &&
          member.roleIds.some((id) => adminRoles.has(id)),
      )
      .sort(
        (a, b) =>
          Number(a.invitedBy !== null) - Number(b.invitedBy !== null) ||
          (a.joinedAt ?? Infinity) - (b.joinedAt ?? Infinity),
      );
    const owner = admins.at(0);
    if (owner) {
      plan.ownerId = owner.id;
      set(owner.id, { roleIds: [...owner.roleIds, OwnerRoleId] });
      plan.notes.push(
        `${owner.name} becomes the Owner, as the person who set up the workspace.`,
      );
    } else
      plan.notes.push(
        "Nobody active is an Administrator, so nobody was made Owner.",
      );
  }

  // 4. Every lead inside their group, as an overseer; removed people lead nothing.
  const groupsOf = new Map(
    members.map((member) => [member.id, [...member.workGroupIds]]),
  );
  const leadsOf = new Map<string, string[]>();
  for (const group of groups) {
    const status = (id: string) =>
      members.find((member) => member.id === id)?.status;
    const leads = group.leadIds.filter(
      (id) => status(id) && status(id) !== "removed",
    );
    leadsOf.set(group.id, leads);
    const change: Record<string, unknown> = {};
    if (!sameList(group.leadIds, leads)) change.leadIds = leads;
    if (group.skip === null)
      change.assign = {
        on: false,
        dailyLimit: 3,
        headsUpHours: 24,
        skip: leads,
      };
    if (Object.keys(change).length) plan.groups[group.id] = change;
    for (const id of leads) {
      const joined = groupsOf.get(id) ?? [];
      if (!joined.includes(group.id)) {
        groupsOf.set(id, [...joined, group.id]);
        set(id, { workGroupIds: [...joined, group.id] });
        plan.notes.push(`A lead of ${group.id} joined it as a member.`);
      }
    }
  }

  // 3. Rank and leadOf for everyone.
  for (const member of members) {
    const roleIds =
      (plan.members[member.id]?.roleIds as string[] | undefined) ??
      member.roleIds;
    const rank = rankOf(roleIds, roles);
    const leadOf = groups
      .filter((group) => leadsOf.get(group.id)?.includes(member.id))
      .map((group) => group.id);
    if (member.rank !== rank) set(member.id, { rank });
    if (!sameList(member.leadOf, leadOf)) set(member.id, { leadOf });
  }

  // 5. Open tasks back from people turned off or removed.
  const gone = new Set(
    members
      .filter((m) => m.status === "disabled" || m.status === "removed")
      .map((m) => m.id),
  );
  plan.tasks = openTasks
    .filter((task) => gone.has(task.memberId) && !task.inReview)
    .map((task) => task.id);
  return plan;
}

const list = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];

function readMemberForUpdate(id: string, data: DocumentData): MemberForUpdate {
  return {
    id,
    name: String(data.displayName || data.email || id),
    status: typeof data.status === "string" ? data.status : "removed",
    roleIds: list(data.roleIds),
    workGroupIds: list(data.workGroupIds),
    invitedBy: typeof data.invitedBy === "string" ? data.invitedBy : null,
    joinedAt: data.joinedAt?.toMillis?.() ?? null,
    rank: typeof data.rank === "number" ? data.rank : null,
    leadOf: Array.isArray(data.leadOf) ? list(data.leadOf) : null,
  };
}

export const ownersAndRanks: PlatformUpdate = {
  id: "2026-11-13-owners-and-ranks",
  title:
    "Add the Owner role, rank everyone by their roles, and keep leads inside their groups",
  run: async ({ db, dryRun }) => {
    const [rolesDoc, members, groups, open] = await Promise.all([
      db.doc("config/roles").get(),
      db.collection("members").get(),
      db.collection("workGroups").get(),
      db.collection("tasks").where("doneAt", "==", null).get(),
    ]);
    const plan = planOwnersAndRanks(
      readRoles(rolesDoc.data()),
      members.docs.map((doc) => readMemberForUpdate(doc.id, doc.data())),
      groups.docs.map((doc) => ({
        id: doc.id,
        leadIds: list(doc.data().leadIds),
        skip: doc.data().assign ? list(doc.data().assign.skip) : null,
      })),
      open.docs
        .filter((doc) => typeof doc.data().memberId === "string")
        .map((doc) => ({
          id: doc.id,
          memberId: doc.data().memberId as string,
          inReview:
            Boolean(doc.data().sentForReviewAt) && !doc.data().approvedAt,
        })),
    );
    const changed =
      (plan.roles ? 1 : 0) +
      Object.keys(plan.members).length +
      Object.keys(plan.groups).length +
      plan.tasks.length;
    if (!dryRun && changed > 0) {
      const writer = db.bulkWriter();
      if (plan.roles)
        writer.set(
          db.doc("config/roles"),
          writeRoles(plan.roles, rolesVersion(rolesDoc.data()) + 1),
        );
      for (const [id, change] of Object.entries(plan.members))
        writer.update(db.doc(`members/${id}`), change);
      for (const [id, change] of Object.entries(plan.groups))
        writer.update(db.doc(`workGroups/${id}`), change);
      for (const id of plan.tasks)
        writer.update(db.doc(`tasks/${id}`), {
          memberId: null,
          updatedAt: FieldValue.serverTimestamp(),
        });
      await writer.close();
      await db.collection("activity").add({
        area: "roles",
        action: "platformUpdate",
        targetId: plan.ownerId,
        summary:
          "Playbook update: Owner role, ranks, and leads inside their groups",
        before: null,
        after: null,
        actorId: null,
        at: FieldValue.serverTimestamp(),
      });
    }
    const verb = dryRun ? "Would change" : "Changed";
    return {
      summary: `${verb} ${Object.keys(plan.members).length} members, ${Object.keys(plan.groups).length} groups and ${plan.tasks.length} open tasks${plan.roles ? ", and the roles" : ""}.`,
      changed,
      notes: plan.notes.slice(0, 100),
    };
  },
};

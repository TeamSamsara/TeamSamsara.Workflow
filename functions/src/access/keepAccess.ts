// File : /TeamSamsara.Workflow/functions/src/access/keepAccess.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Keeps the access fields on each member record in step, so the
// database rules can check rank and leads in one lookup: rank (their highest
// role's position, Owners above all) and leadOf (the groups they lead). Also
// keeps leads inside their groups: becoming a lead adds someone to the group,
// and leaving the group ends their lead. Nobody writes these fields but here.

import {
  FieldValue,
  getFirestore,
  type Firestore,
} from "firebase-admin/firestore";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { rankOf } from "../../../engine/src/index.js";
import { readMember, readRoles } from "./readAccess.js";

const list = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length &&
  [...a].sort().every((entry, i) => entry === [...b].sort()[i]);

/** Works out one member's rank and leads, and writes them when they changed. */
async function refreshMember(db: Firestore, memberId: string) {
  const [memberDoc, rolesDoc, leading] = await Promise.all([
    db.doc(`members/${memberId}`).get(),
    db.doc("config/roles").get(),
    db
      .collection("workGroups")
      .where("leadIds", "array-contains", memberId)
      .get(),
  ]);
  const data = memberDoc.data();
  if (!data) return;
  const member = readMember(memberId, data);
  const rank = rankOf(member.roleIds, readRoles(rolesDoc.data()));
  const groupIds = new Set(member.workGroupIds);

  const leadOf =
    member.status === "removed"
      ? []
      : leading.docs.map((group) => group.id).filter((id) => groupIds.has(id));

  if (data.rank === rank && sameList(list(data.leadOf), leadOf)) return;
  await memberDoc.ref.update({ rank, leadOf });
}

/** A member's roles, groups or status changed. */
export const onMemberAccessChanged = onDocumentWritten(
  { document: "members/{memberId}" },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!after) return;
    const relevant =
      !before ||
      after.rank === undefined ||
      after.leadOf === undefined ||
      JSON.stringify(before.roleIds) !== JSON.stringify(after.roleIds) ||
      JSON.stringify(before.workGroupIds) !==
        JSON.stringify(after.workGroupIds) ||
      before.status !== after.status;
    if (!relevant) return;
    const db = getFirestore();
    const memberId = event.params.memberId;
    // Leaving a group ends being its lead; a removed member leads nothing.
    const left =
      after.status === "removed"
        ? list(before?.workGroupIds).concat(list(after.workGroupIds))
        : list(before?.workGroupIds).filter(
            (id) => !list(after.workGroupIds).includes(id),
          );
    for (const groupId of new Set(left)) {
      const group = await db.doc(`workGroups/${groupId}`).get();
      if (list(group.data()?.leadIds).includes(memberId))
        await group.ref.update({ leadIds: FieldValue.arrayRemove(memberId) });
    }
    await refreshMember(db, memberId);
  },
);

/** The roles changed: positions or Owners can move everyone's rank. */
export const onRolesChanged = onDocumentWritten(
  { document: "config/roles", timeoutSeconds: 300 },
  async (event) => {
    const db = getFirestore();
    const roles = readRoles(event.data?.after.data());
    const members = await db.collection("members").get();
    const writer = db.bulkWriter();
    for (const doc of members.docs) {
      const rank = rankOf(list(doc.data().roleIds), roles);
      if (doc.data().rank !== rank) writer.update(doc.ref, { rank });
    }
    await writer.close();
  },
);

/** A group's leads changed: new leads join the group, everyone's leadOf follows. */
export const onGroupLeadsChanged = onDocumentWritten(
  { document: "workGroups/{groupId}" },
  async (event) => {
    const db = getFirestore();
    const groupId = event.params.groupId;
    const before = list(event.data?.before.data()?.leadIds);
    const after = list(event.data?.after.data()?.leadIds);
    if (sameList(before, after) && event.data?.after.exists) return;
    const touched = new Set([...before, ...after]);
    for (const memberId of after) {
      const member = await db.doc(`members/${memberId}`).get();
      if (member.exists && !list(member.data()?.workGroupIds).includes(groupId))
        await member.ref.update({
          workGroupIds: FieldValue.arrayUnion(groupId),
        });
    }
    for (const memberId of touched) await refreshMember(db, memberId);
  },
);

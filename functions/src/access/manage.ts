// File : /TeamSamsara.Workflow/functions/src/access/manage.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : The one server call for protected changes: a member's name,
// roles, groups and access, removing or inviting someone, saving the roles,
// setting a group's leads, and the Owner role. It loads who's asking, works
// the change out with the shared rules (managePlan), and writes the change
// and its activity record together in one transaction. The database refuses
// these fields from the app directly, so this is the only way in.

import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { recordActivity } from "./activity.js";
import {
  planManage,
  type GroupEntry,
  type ManageOp,
  type MemberEntry,
} from "./managePlan.js";
import {
  readGroup,
  readMember,
  readRoles,
  requireActor,
  rolesVersion,
  writeRoles,
} from "./readAccess.js";

const ops: ManageOp["op"][] = [
  "member.update",
  "member.access",
  "member.remove",
  "member.invite",
  "roles.save",
  "group.leads",
  "owner.give",
  "owner.stepDown",
];

function readOp(data: unknown): ManageOp {
  const op = (data ?? {}) as { op?: unknown };
  if (typeof op.op !== "string" || !ops.includes(op.op as ManageOp["op"]))
    throw new HttpsError("invalid-argument", "invalid");
  return op as ManageOp;
}

/** Makes the sign-in account for a new invitee, or finds the one they have. */
async function accountFor(email: string): Promise<string> {
  const auth = getAuth();
  try {
    return (await auth.getUserByEmail(email)).uid;
  } catch {
    return (await auth.createUser({ email, emailVerified: false })).uid;
  }
}

export const manage = onCall({ timeoutSeconds: 120 }, async (request) => {
  const db = getFirestore();
  const op = readOp(request.data);
  const actor = await requireActor(db, request.auth?.uid);

  // An invite needs its account before the transaction (which can't make one).
  let inviteeId: string | null = null;
  if (op.op === "member.invite") {
    const email = String(op.email ?? "")
      .trim()
      .toLowerCase();
    const existing = await db
      .collection("members")
      .where("email", "==", email)
      .limit(1)
      .get();
    inviteeId = existing.empty ? null : existing.docs[0].id;
  }

  const result = await db.runTransaction(async (transaction) => {
    const rolesDoc = await transaction.get(db.doc("config/roles"));
    const memberDocs = await transaction.get(db.collection("members"));
    const groupDocs = await transaction.get(db.collection("workGroups"));
    const members = new Map<string, MemberEntry>(
      memberDocs.docs.map((doc) => [doc.id, readMember(doc.id, doc.data())]),
    );
    const groups = new Map<string, GroupEntry>(
      groupDocs.docs.map((doc) => [doc.id, readGroup(doc.id, doc.data())]),
    );
    const state = {
      roles: readRoles(rolesDoc.data()),
      rolesVersion: rolesVersion(rolesDoc.data()),
      members,
      groups,
    };
    const planned = planManage(
      actor,
      state,
      op,
      inviteeId ? (members.get(inviteeId) ?? null) : null,
    );
    if (!planned.ok) return planned;
    const { plan } = planned;

    for (const [id, change] of Object.entries(plan.members))
      transaction.update(db.doc(`members/${id}`), {
        ...change,
        ...(change.status === "invited" && change.invitedBy
          ? { invitedAt: FieldValue.serverTimestamp() }
          : {}),
      });
    for (const [id, change] of Object.entries(plan.groups))
      transaction.update(db.doc(`workGroups/${id}`), change);
    if (plan.roles)
      transaction.set(
        db.doc("config/roles"),
        writeRoles(plan.roles, state.rolesVersion + 1),
      );
    if (plan.invite) {
      const uid = await accountFor(plan.invite.email);
      transaction.set(db.doc(`members/${uid}`), {
        ...plan.invite.record,
        invitedAt: FieldValue.serverTimestamp(),
      });
      plan.activity.forEach((entry) => {
        if (entry.targetId === null) entry.targetId = uid;
      });
    }
    for (const entry of plan.activity)
      recordActivity(db, transaction, actor.id, entry);
    return planned;
  });

  if (!result.ok) {
    const code =
      result.reason === "notFound"
        ? "not-found"
        : result.reason === "invalid"
          ? "invalid-argument"
          : result.reason === "stale" || result.reason === "alreadyMember"
            ? "failed-precondition"
            : "permission-denied";
    throw new HttpsError(code, result.reason);
  }
  return { done: true };
});

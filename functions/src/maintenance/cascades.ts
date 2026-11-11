// File : /TeamSamsara.Workflow/functions/src/maintenance/cascades.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tidying up straight after something is deleted, so nothing keeps
// pointing at it: a work group (it comes off members, events and repeats; its
// open tasks become unassigned), a people tag (it comes off members), a member
// record (it comes off groups and events; their open tasks are unassigned), a
// repeat (its remaining events go with their open tasks; finished ones stay
// as history) and a set (its remaining events just stop pointing at it).
// The app does most of this itself; these catch what it couldn't see.

import {
  FieldValue,
  getFirestore,
  type DocumentReference,
  type Query,
  type UpdateData,
  type DocumentData,
} from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";

const db = () => getFirestore();

type Write =
  | { ref: DocumentReference; update: UpdateData<DocumentData> }
  | { ref: DocumentReference; remove: true };

async function commit(writes: readonly Write[]): Promise<void> {
  for (let start = 0; start < writes.length; start += 500) {
    const batch = db().batch();
    for (const write of writes.slice(start, start + 500)) {
      if ("remove" in write) batch.delete(write.ref);
      else batch.update(write.ref, write.update);
    }
    await batch.commit();
  }
}

async function updateAll(
  query: Query,
  update: UpdateData<DocumentData>,
): Promise<Write[]> {
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ ref: doc.ref, update }));
}

/** Open tasks given to this group or person become unassigned. */
async function unassignOpenTasks(field: "workGroupId" | "memberId", id: string) {
  const snapshot = await db()
    .collection("tasks")
    .where(field, "==", id)
    .where("doneAt", "==", null)
    .get();
  return snapshot.docs.map((doc) => ({
    ref: doc.ref,
    update: { [field]: null, updatedAt: FieldValue.serverTimestamp() },
  }));
}

export const onWorkGroupDeleted = onDocumentDeleted(
  "workGroups/{groupId}",
  async (event) => {
    const id = event.params.groupId;
    const remove = FieldValue.arrayRemove(id);
    const writes = [
      ...(await updateAll(
        db().collection("members").where("workGroupIds", "array-contains", id),
        { workGroupIds: remove },
      )),
      ...(await updateAll(
        db().collection("events").where("groupIds", "array-contains", id),
        { groupIds: remove },
      )),
      ...(await updateAll(
        db().collection("repeats").where("groupIds", "array-contains", id),
        { groupIds: remove },
      )),
      ...(await unassignOpenTasks("workGroupId", id)),
    ];
    await commit(writes);
    logger.info("Tidied after a work group was deleted", { id, writes: writes.length });
  },
);

export const onPeopleTagDeleted = onDocumentDeleted(
  "peopleTags/{tagId}",
  async (event) => {
    const id = event.params.tagId;
    const writes = await updateAll(
      db().collection("members").where("tagIds", "array-contains", id),
      { tagIds: FieldValue.arrayRemove(id) },
    );
    await commit(writes);
    logger.info("Tidied after a people tag was deleted", { id, writes: writes.length });
  },
);

export const onMemberDeleted = onDocumentDeleted(
  "members/{memberId}",
  async (event) => {
    const id = event.params.memberId;
    const remove = FieldValue.arrayRemove(id);
    const writes = [
      ...(await updateAll(
        db().collection("workGroups").where("leadIds", "array-contains", id),
        { leadIds: remove },
      )),
      ...(await updateAll(
        db().collection("events").where("memberIds", "array-contains", id),
        { memberIds: remove },
      )),
      ...(await unassignOpenTasks("memberId", id)),
    ];
    await commit(writes);
    logger.info("Tidied after a member record was deleted", { id, writes: writes.length });
  },
);

export const onRepeatDeleted = onDocumentDeleted(
  "repeats/{repeatId}",
  async (event) => {
    const id = event.params.repeatId;
    const events = await db().collection("events").where("repeatId", "==", id).get();
    const writes: Write[] = [];
    for (const doc of events.docs) {
      const data = doc.data();
      const tasks = await db().collection("tasks").where("eventId", "==", doc.id).get();
      for (const task of tasks.docs) {
        writes.push(
          task.data().doneAt
            ? {
                ref: task.ref,
                update: {
                  eventGone: { title: data.title ?? "An event", startsAt: data.startsAt ?? null },
                  updatedAt: FieldValue.serverTimestamp(),
                },
              }
            : { ref: task.ref, remove: true },
        );
      }
      writes.push({ ref: doc.ref, remove: true });
    }
    await commit(writes);
    logger.info("Tidied after a repeat was deleted", { id, events: events.size });
  },
);

export const onEventSetDeleted = onDocumentDeleted(
  "eventSets/{setId}",
  async (event) => {
    const id = event.params.setId;
    const writes = await updateAll(
      db().collection("events").where("setId", "==", id),
      { setId: null },
    );
    await commit(writes);
    logger.info("Tidied after a set was deleted", { id, writes: writes.length });
  },
);

// File : /TeamSamsara.Workflow/app/src/features/people-tags/service/peopleTagService.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Putting people tags on a member, deleting a tag (it comes off
// everyone who had it, in the same batches), and saving how a member likes
// Team availability (who they hide, their order, whose time).

import { arrayRemove, doc, updateDoc } from "firebase/firestore";
import {
  Collections,
  commitWrites,
  type BatchWrite,
  type MemberRecord,
  type TeamViewPrefs,
} from "@/core/data";
import { db } from "@/lib/firebase";

/** The most tags one member can have (firestore.rules checks the same). */
export const maxTagsPerMember = 20;

export function setMemberTags(
  memberId: string,
  tagIds: readonly string[],
): Promise<void> {
  return updateDoc(doc(db, Collections.members, memberId), {
    tagIds: [...new Set(tagIds)].slice(0, maxTagsPerMember),
  });
}

/** Deletes the tag and takes it off the members who have it. */
export function deletePeopleTag(
  tagId: string,
  members: readonly Pick<MemberRecord, "id" | "tagIds">[],
): Promise<void> {
  const writes: BatchWrite[] = [
    ...members
      .filter((member) => member.tagIds.includes(tagId))
      .map(
        (member): BatchWrite =>
          (batch) =>
            batch.update(doc(db, Collections.members, member.id), {
              tagIds: arrayRemove(tagId),
            }),
      ),
    (batch) => batch.delete(doc(db, Collections.peopleTags, tagId)),
  ];
  return commitWrites(db, writes);
}

/** Firestore keeps lists short; nobody has more teammates than this. */
const maxPeople = 300;

export function saveTeamView(
  memberId: string,
  view: TeamViewPrefs,
): Promise<void> {
  return updateDoc(doc(db, Collections.members, memberId), {
    prefs: {
      teamView: {
        hidden: view.hidden.slice(0, maxPeople),
        order: view.order.slice(0, maxPeople),
        zone: view.zone,
      },
    },
  });
}

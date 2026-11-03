// File : /TeamSamsara.Workflow/app/src/core/session/memberRecordService.ts
// Version : 1.0.0
// Latest commit: core/session
// Author : Gerrah
// Purpose : The signed-in person's own member record: listening to it, marking
// an invited member active on their first sign-in, and noting when they were
// last active. These are the only writes a member makes to their own record.

import {
  doc,
  onSnapshot,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import {
  Collections,
  memberConverter,
  serverTime,
  type MemberRecord,
} from "@/core/data";
import { db } from "@/lib/firebase";

function ownMemberRef(memberId: string) {
  return doc(db, Collections.members, memberId);
}

/**
 * Calls onData with the record, or null when there is none. A "missing" answer
 * that only came from the browser's copy is skipped: on a new device the record
 * may simply not be downloaded yet, and the server's answer follows.
 */
export function listenToOwnMember(
  memberId: string,
  onData: (member: MemberRecord | null) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    ownMemberRef(memberId).withConverter(memberConverter),
    (snapshot) => {
      if (!snapshot.exists() && snapshot.metadata.fromCache) return;
      onData(snapshot.exists() ? snapshot.data() : null);
    },
    onError,
  );
}

/** First sign-in after an invite: Invited becomes Active. */
export function activateOwnMember(memberId: string): Promise<void> {
  return updateDoc(ownMemberRef(memberId), {
    status: "active",
    joinedAt: serverTime(),
    lastActiveAt: serverTime(),
  });
}

/** Notes that the member opened the app, for "Last active" on the members page. */
export function touchLastActive(memberId: string): Promise<void> {
  return updateDoc(ownMemberRef(memberId), { lastActiveAt: serverTime() });
}

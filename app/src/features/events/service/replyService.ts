// File : /TeamSamsara.Workflow/app/src/features/events/service/replyService.ts
// Version : 1.0.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : Replying to an event (Going, Maybe or Can't go, with an optional
// note), which changes only the member's own reply, and reminding the people
// who haven't replied yet (the server sends those, at most once an hour).

import { doc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { Collections, serverTime } from "@/core/data";
import { db, functions } from "@/lib/firebase";
import { AttendanceLimits, type ReplyAnswer } from "../types/attendance";

export function saveReply(
  eventId: string,
  memberId: string,
  answer: ReplyAnswer,
  note: string,
): Promise<void> {
  return updateDoc(doc(db, Collections.events, eventId), {
    [`replies.${memberId}`]: {
      answer,
      note: note.trim().slice(0, AttendanceLimits.note),
      at: serverTime(),
    },
  });
}

/** Reminds who hasn't replied; gives back how many were reminded. */
export async function remindReplies(eventId: string): Promise<number> {
  const call = httpsCallable<{ eventId: string }, { reminded: number }>(
    functions,
    "remindReplies",
  );
  return (await call({ eventId })).data.reminded;
}

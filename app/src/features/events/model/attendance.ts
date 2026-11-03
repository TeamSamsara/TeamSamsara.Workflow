// File : /TeamSamsara.Workflow/app/src/features/events/model/attendance.ts
// Version : 1.0.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : Who an event asks to reply and where things stand: the people
// in it (everyone in its groups and the people added), whether each is
// required, their reply, the counts, and the member's own reply.

import type { Attendance, EventReply, ReplyAnswer } from "../types/attendance";
import type { Audience } from "../types/audience";

interface Person {
  id: string;
  workGroupIds: readonly string[];
}

/** Everyone in it, in the order the people are given. */
export function peopleIn<T extends Person>(
  audience: Audience,
  people: readonly T[],
): T[] {
  if (audience.everyone) return [...people];
  return people.filter(
    (person) =>
      audience.memberIds.includes(person.id) ||
      person.workGroupIds.some((id) => audience.groupIds.includes(id)),
  );
}

/** Whether the event asks this member to reply. */
export function isAsked(
  event: Audience & Attendance,
  member: Person | null,
): boolean {
  return Boolean(member && event.asksReply && peopleIn(event, [member]).length);
}

export type ReplyState = ReplyAnswer | "waiting";

export interface Attendee<T> {
  person: T;
  required: boolean;
  reply: EventReply | null;
}

export interface AttendanceSummary<T> {
  required: Attendee<T>[];
  optional: Attendee<T>[];
  counts: Record<ReplyState, number>;
  /** Who hasn't replied yet. */
  waitingIds: string[];
}

export function attendanceSummary<T extends Person>(
  event: Audience & Attendance & { replies: Record<string, EventReply> },
  people: readonly T[],
): AttendanceSummary<T> {
  const everyone = peopleIn(event, people).map((person): Attendee<T> => ({
    person,
    required: event.requiredIds.includes(person.id),
    reply: event.replies[person.id] ?? null,
  }));
  const counts: Record<ReplyState, number> = {
    going: 0,
    maybe: 0,
    cant: 0,
    waiting: 0,
  };
  for (const entry of everyone) counts[entry.reply?.answer ?? "waiting"] += 1;
  return {
    required: everyone.filter((entry) => entry.required),
    optional: everyone.filter((entry) => !entry.required),
    counts,
    waitingIds: everyone
      .filter((entry) => !entry.reply)
      .map((entry) => entry.person.id),
  };
}

/** The member's own reply state, or null when the event doesn't ask them. */
export function myReply(
  event: Audience & Attendance & { replies: Record<string, EventReply> },
  member: Person | null,
): ReplyState | null {
  if (!member || !isAsked(event, member)) return null;
  return event.replies[member.id]?.answer ?? "waiting";
}

/**
 * Who's required after the people change: turning asking on makes everyone
 * in it required; people added later start optional; people taken out drop.
 */
export function requiredAfter(
  attendance: Attendance,
  wasAsking: boolean,
  peopleIds: readonly string[],
): string[] {
  if (!attendance.asksReply) return [];
  if (!wasAsking) return [...peopleIds];
  return attendance.requiredIds.filter((id) => peopleIds.includes(id));
}

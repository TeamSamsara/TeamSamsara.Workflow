// File : /TeamSamsara.Workflow/app/src/features/events/model/eventDraft.ts
// Version : 1.1.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : An event as its form holds it (a date box, start and end time
// boxes, who's in it), what's wrong with it, and back to an event's fields.

import { checkLink } from "@/features/work-groups";
import { fromDateAndTime, toDateAndTime } from "@/features/tasks";
import { EventFormText } from "../ui/eventsContent";
import { nobody, type Audience } from "../types/audience";
import {
  defaultEventMinutes,
  type EventFields,
  type EventRecord,
} from "../types/eventTypes";

export interface EventDraft {
  title: string;
  eventTypeId: string | null;
  date: string;
  time: string;
  /** "21:00"; earlier than the start means it ends the next day. */
  endTime: string;
  link: string;
  notes: string;
  details: Record<string, string>;
  audience: Audience;
}

const toMinutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return (hour || 0) * 60 + (minute || 0);
};

const fromMinutes = (total: number) => {
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
};

/** How long the draft lasts, in minutes (an end before the start is the next day). */
export function draftMinutes(
  draft: Pick<EventDraft, "time" | "endTime">,
): number {
  const length = toMinutes(draft.endTime) - toMinutes(draft.time);
  return length > 0 ? length : length + 1440;
}

/** Moves the start and keeps the length, so the end follows. */
export function withStartTime(draft: EventDraft, time: string): EventDraft {
  return {
    ...draft,
    time,
    endTime: fromMinutes(toMinutes(time) + draftMinutes(draft)),
  };
}

/** The end time for a start and a length. */
export function endTimeFor(time: string, minutes: number): string {
  return fromMinutes(toMinutes(time) + minutes);
}

export function emptyEventDraft(date = "", time = "19:00"): EventDraft {
  return {
    title: "",
    eventTypeId: null,
    date,
    time,
    endTime: endTimeFor(time, defaultEventMinutes),
    link: "",
    notes: "",
    details: {},
    audience: nobody,
  };
}

export function draftFromEvent(
  event: EventRecord,
  timeZone: string,
): EventDraft {
  const { date, time } = toDateAndTime(event.startsAt, timeZone);
  const minutes = Math.max(
    5,
    Math.round((event.endsAt.getTime() - event.startsAt.getTime()) / 60_000),
  );
  return {
    title: event.title,
    eventTypeId: event.eventTypeId,
    date,
    time,
    endTime: endTimeFor(time, Math.min(minutes, 1440)),
    audience: {
      everyone: event.everyone,
      groupIds: event.groupIds,
      memberIds: event.memberIds,
    },
    link: event.link ?? "",
    notes: event.notes,
    details: event.details,
  };
}

export interface EventDraftProblems {
  title?: string;
  date?: string;
  link?: string;
  count: number;
}

export function checkEventDraft(draft: EventDraft): EventDraftProblems {
  const title = draft.title.trim() ? undefined : EventFormText.titleRequired;
  const date = draft.date ? undefined : EventFormText.dateRequired;
  const link =
    draft.link.trim() && checkLink({ label: "link", url: draft.link })
      ? EventFormText.linkInvalid
      : undefined;
  return {
    title,
    date,
    link,
    count: [title, date, link].filter(Boolean).length,
  };
}

/** The event's fields; null while the date is missing. */
export function fieldsFromDraft(
  draft: EventDraft,
  timeZone: string,
): EventFields | null {
  const startsAt = fromDateAndTime(draft.date, draft.time, timeZone);
  if (!startsAt) return null;
  return {
    title: draft.title,
    eventTypeId: draft.eventTypeId,
    startsAt,
    endsAt: new Date(startsAt.getTime() + draftMinutes(draft) * 60_000),
    audience: draft.audience,
    link: draft.link.trim() || null,
    notes: draft.notes,
    details: draft.details,
  };
}

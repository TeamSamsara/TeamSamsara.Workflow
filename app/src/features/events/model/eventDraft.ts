// File : /TeamSamsara.Workflow/app/src/features/events/model/eventDraft.ts
// Version : 1.0.0
// Latest commit: feature/calendar-events
// Author : Gerrah
// Purpose : An event as its form holds it (the start as a date box and a time
// box), what's wrong with it, and back to an event's fields.

import { checkLink } from "@/features/work-groups";
import { fromDateAndTime, toDateAndTime } from "@/features/tasks";
import { EventFormText } from "../ui/eventsContent";
import type { EventFields, EventRecord } from "../types/eventTypes";

export interface EventDraft {
  title: string;
  eventTypeId: string | null;
  date: string;
  time: string;
  link: string;
  notes: string;
  details: Record<string, string>;
}

export function emptyEventDraft(date = "", time = "19:00"): EventDraft {
  return {
    title: "",
    eventTypeId: null,
    date,
    time,
    link: "",
    notes: "",
    details: {},
  };
}

export function draftFromEvent(
  event: EventRecord,
  timeZone: string,
): EventDraft {
  const { date, time } = toDateAndTime(event.startsAt, timeZone);
  return {
    title: event.title,
    eventTypeId: event.eventTypeId,
    date,
    time,
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
    link: draft.link.trim() || null,
    notes: draft.notes,
    details: draft.details,
  };
}

// File : /TeamSamsara.Workflow/app/src/features/events/types/eventTypes.ts
// Version : 1.1.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : An event on the calendar: a match, a content drop, a sponsor
// activation, a meeting. It has a start and an end, who's in it, an optional
// type and link, the values for its workflows' {gaps}, and the workflows used
// to make its tasks.

import type { DocumentData } from "firebase/firestore";
import {
  createConverter,
  fromDate,
  readDate,
  readMap,
  readOptionalString,
  readString,
  readStringList,
} from "@/core/data";
import { readAudience, type Audience } from "./audience";

export interface EventRecord extends Audience {
  id: string;
  title: string;
  eventTypeId: string | null;
  startsAt: Date;
  endsAt: Date;
  /** Where to watch or join. Fills {link}. */
  link: string | null;
  /** Values for the gaps its workflows ask for, e.g. { opponent: "Team Nova" }. */
  details: Record<string, string>;
  workflowIds: string[];
  notes: string;
  /** The repeat it belongs to; null for a one-time event. */
  repeatId: string | null;
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** The part of an event its form changes. */
export type EventFields = Pick<
  EventRecord,
  "title" | "eventTypeId" | "startsAt" | "endsAt" | "link" | "details" | "notes"
> & { audience: Audience };

/** How long an event lasts when nothing says otherwise. */
export const defaultEventMinutes = 120;

/** Sizes the app keeps to (firestore.rules checks the same). */
export const EventLimits = {
  title: 120,
  link: 500,
  notes: 2000,
  detail: 200,
  details: 20,
  workflows: 5,
} as const;

function readDetails(data: DocumentData): Record<string, string> {
  const details: Record<string, string> = {};
  for (const [key, value] of Object.entries(readMap(data, "details"))) {
    if (typeof value === "string") details[key] = value;
  }
  return details;
}

export const eventConverter = createConverter<EventRecord>({
  parse: (id, data) => {
    const startsAt = readDate(data, "startsAt") ?? new Date(0);
    return {
      id,
      title: readString(data, "title"),
      eventTypeId: readOptionalString(data, "eventTypeId"),
      startsAt,
      // Events saved before end times existed last the usual length.
      endsAt:
        readDate(data, "endsAt") ??
        new Date(startsAt.getTime() + defaultEventMinutes * 60_000),
      ...readAudience(data),
      link: readOptionalString(data, "link"),
      details: readDetails(data),
      workflowIds: readStringList(data, "workflowIds"),
      notes: readString(data, "notes"),
      repeatId: readOptionalString(data, "repeatId"),
      createdBy: readString(data, "createdBy"),
      createdAt: readDate(data, "createdAt"),
      updatedAt: readDate(data, "updatedAt"),
    };
  },
  serialize: (event) => ({
    title: event.title,
    eventTypeId: event.eventTypeId,
    startsAt: fromDate(event.startsAt),
    endsAt: fromDate(event.endsAt),
    link: event.link,
    details: event.details,
    workflowIds: event.workflowIds,
    notes: event.notes,
    repeatId: event.repeatId,
    everyone: event.everyone,
    groupIds: event.groupIds,
    memberIds: event.memberIds,
    createdBy: event.createdBy,
    createdAt: fromDate(event.createdAt),
    updatedAt: fromDate(event.updatedAt),
  }),
});

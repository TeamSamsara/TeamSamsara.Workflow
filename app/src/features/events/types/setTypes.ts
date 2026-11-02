// File : /TeamSamsara.Workflow/app/src/features/events/types/setTypes.ts
// Version : 1.0.0
// Latest commit: feature/event-sets
// Author : Gerrah
// Purpose : A set of events planned together: a competition split, a month of
// content, a sponsor's deliverables. Each event is its own (it can move or
// change alone) and carries the set's id; the set keeps its name and what its
// events were made with, so more can be added the same way later.

import {
  createConverter,
  readDate,
  readNumber,
  readOptionalString,
  readString,
  readStringList,
} from "@/core/data";
import { readAudience, type Audience } from "./audience";
import { defaultEventMinutes } from "./eventTypes";

export interface EventSetRecord extends Audience {
  id: string;
  name: string;
  eventTypeId: string | null;
  /** "vs. {opponent}": each event's title, its gaps filled per event. */
  titlePattern: string;
  /** How long its events usually last. */
  minutes: number;
  workflowIds: string[];
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Sizes the app keeps to (firestore.rules checks the same). */
export const EventSetLimits = {
  name: 80,
  /** Events made in one go. */
  events: 100,
} as const;

export const eventSetConverter = createConverter<EventSetRecord>({
  parse: (id, data) => ({
    id,
    name: readString(data, "name"),
    eventTypeId: readOptionalString(data, "eventTypeId"),
    titlePattern: readString(data, "titlePattern"),
    minutes: readNumber(data, "minutes") || defaultEventMinutes,
    workflowIds: readStringList(data, "workflowIds"),
    ...readAudience(data),
    createdBy: readString(data, "createdBy"),
    createdAt: readDate(data, "createdAt"),
    updatedAt: readDate(data, "updatedAt"),
  }),
  serialize: (set) =>
    Object.fromEntries(Object.entries(set).filter(([key]) => key !== "id")),
});

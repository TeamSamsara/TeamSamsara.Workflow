// File : /TeamSamsara.Workflow/app/src/core/data/models/taskSetupModels.ts
// Version : 1.0.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : The workspace's own lists that tasks and events use: statuses (the
// steps a task moves through), event types and tags. The words are the
// workspace's; the only thing the app knows is what each status counts as.

import type { DocumentData } from "firebase/firestore";
import { createConverter } from "../firestoreConverter";
import { readChoice, readNumber, readString } from "../fieldReaders";

// #region Statuses
/**
 * What a status counts as, whatever it's called. open: still to do.
 * awaitingApproval: done, waiting for someone with Approve tasks.
 * finished: done. closed: won't be done (skipped, cancelled).
 */
export const StatusCategories = [
  "open",
  "awaitingApproval",
  "finished",
  "closed",
] as const;
export type StatusCategory = (typeof StatusCategories)[number];

/** The pill colours a status can use (the Pill component's tones). */
export const StatusTones = [
  "neutral",
  "info",
  "alert",
  "success",
  "error",
  "muted",
] as const;
export type StatusTone = (typeof StatusTones)[number];

export interface StatusRecord {
  id: string;
  name: string;
  tone: StatusTone;
  category: StatusCategory;
  /** Lower comes first; the first open status is where new tasks start. */
  position: number;
}

export const statusConverter = createConverter<StatusRecord>({
  parse: (id: string, data: DocumentData) => ({
    id,
    name: readString(data, "name"),
    tone: readChoice(data, "tone", StatusTones, "neutral"),
    category: readChoice(data, "category", StatusCategories, "open"),
    position: readNumber(data, "position"),
  }),
  serialize: ({ name, tone, category, position }) => ({
    name,
    tone,
    category,
    position,
  }),
});
// #endregion

// #region Event types and tags
/** A named colour: an event type or a tag. */
export interface ColouredItem {
  id: string;
  name: string;
  /** A hex colour like #3E8EF7. */
  color: string;
  /** Lower comes first. */
  position: number;
}

export type EventTypeRecord = ColouredItem;
export type TagRecord = ColouredItem;

/** Shared by event types and tags, which have the same shape. */
export const colouredItemConverter = createConverter<ColouredItem>({
  parse: (id: string, data: DocumentData) => ({
    id,
    name: readString(data, "name"),
    color: readString(data, "color"),
    position: readNumber(data, "position"),
  }),
  serialize: ({ name, color, position }) => ({ name, color, position }),
});
// #endregion

/** Lists in their order: by position, then by name. */
export function byPosition<TItem extends { position: number; name: string }>(
  items: readonly TItem[],
): TItem[] {
  return [...items].sort(
    (a, b) => a.position - b.position || a.name.localeCompare(b.name),
  );
}

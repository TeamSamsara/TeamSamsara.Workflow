// File : /TeamSamsara.Workflow/app/src/features/workflows/types/workflowTypes.ts
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : A workflow: a reusable list of tasks, each due a set time before or
// after an event starts. Every task has the same basics (title, notes, who it's
// given to, when it's due, tags, needs approval) and can add sections: post
// text per platform, a checklist, reference links, and asking for the link to
// what was published. The steps live inside the workflow's own document.

import type { DocumentData } from "firebase/firestore";
import {
  createConverter,
  fromDate,
  readBoolean,
  readChoice,
  readDate,
  readMap,
  readNumber,
  readOptionalString,
  readString,
  readStringList,
} from "@/core/data";

// #region Due times
export const DueDirections = ["before", "at", "after"] as const;
export type DueDirection = (typeof DueDirections)[number];

/**
 * When a task is due, counted from the event's start. With a clock time, the
 * days are calendar days and the hours are ignored ("2 days before, 7:00 PM");
 * without one, it's an exact amount of time ("1 day 2 hours before").
 */
export interface DueOffset {
  direction: DueDirection;
  days: number;
  hours: number;
  minutes: number;
  /** "19:00", or null to count hours and minutes instead. */
  time: string | null;
}

export const atTheStart: DueOffset = {
  direction: "at",
  days: 0,
  hours: 0,
  minutes: 0,
  time: null,
};
// #endregion

// #region Sections
export interface ChecklistItem {
  id: string;
  text: string;
}

export interface ReferenceLink {
  label: string;
  url: string;
}

/** The text for one platform, e.g. X (or an X Article), keyed by field. */
export interface PlatformPost {
  platformId: string;
  /** A paid-tier format such as "article", or null for a normal post. */
  formatId: string | null;
  texts: Record<string, string>;
}
// #endregion

export interface WorkflowStep {
  /** Stable within the workflow, so the editor can follow a step as it moves. */
  id: string;
  title: string;
  /** How to do it. */
  notes: string;
  workGroupId: string | null;
  memberId: string | null;
  due: DueOffset;
  needsApproval: boolean;
  tagIds: string[];
  /** Post text per platform; null when the task has no post. */
  posts: PlatformPost[] | null;
  checklist: ChecklistItem[] | null;
  /** Examples, folders, briefs. */
  links: ReferenceLink[] | null;
  /** Ask for the link to what was published before it can be done. */
  asksForLiveLink: boolean;
}

export interface WorkflowRecord {
  id: string;
  name: string;
  /** What it's for, in a sentence. */
  description: string;
  /** Suggested when an event of this type is planned. */
  eventTypeId: string | null;
  archived: boolean;
  steps: WorkflowStep[];
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** The part of a workflow its editor changes. */
export type WorkflowFields = Pick<
  WorkflowRecord,
  "name" | "description" | "eventTypeId" | "steps"
>;

/** Sizes the app keeps to (firestore.rules checks the step count). */
export const WorkflowLimits = {
  steps: 40,
  description: 300,
  title: 120,
  notes: 2000,
  checklistItems: 30,
  checklistItem: 200,
  links: 10,
  postText: 100_000,
  tags: 10,
  dueDays: 60,
  dueHours: 23,
  dueMinutes: 59,
} as const;

// #region Reading stored data
function readList(data: DocumentData, field: string): DocumentData[] {
  const value: unknown = data[field];
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is DocumentData =>
      typeof entry === "object" && entry !== null && !Array.isArray(entry),
  );
}

function readWhole(data: DocumentData, field: string, max: number): number {
  const value = Math.trunc(readNumber(data, field));
  return Math.min(Math.max(value, 0), max);
}

const clockTime = /^([01]\d|2[0-3]):[0-5]\d$/;

export function readDue(data: DocumentData): DueOffset {
  const direction = readChoice(data, "direction", DueDirections, "at");
  if (direction === "at") return atTheStart;
  const time = readOptionalString(data, "time");
  return {
    direction,
    days: readWhole(data, "days", WorkflowLimits.dueDays),
    hours: readWhole(data, "hours", WorkflowLimits.dueHours),
    minutes: readWhole(data, "minutes", WorkflowLimits.dueMinutes),
    time: time && clockTime.test(time) ? time : null,
  };
}

function readPosts(data: DocumentData): PlatformPost[] | null {
  if (!Array.isArray(data.posts)) return null;
  return readList(data, "posts").flatMap((post) => {
    const platformId = readString(post, "platformId");
    if (!platformId) return [];
    const texts: Record<string, string> = {};
    for (const [field, text] of Object.entries(readMap(post, "texts"))) {
      if (typeof text === "string") texts[field] = text;
    }
    return [
      { platformId, formatId: readOptionalString(post, "formatId"), texts },
    ];
  });
}

function readChecklist(data: DocumentData): ChecklistItem[] | null {
  if (!Array.isArray(data.checklist)) return null;
  return readList(data, "checklist").map((item, index) => ({
    id: readString(item, "id") || `item${index}`,
    text: readString(item, "text"),
  }));
}

function readLinks(data: DocumentData): ReferenceLink[] | null {
  if (!Array.isArray(data.links)) return null;
  return readList(data, "links").map((link) => ({
    label: readString(link, "label"),
    url: readString(link, "url"),
  }));
}

export function readStep(data: DocumentData, index: number): WorkflowStep {
  return {
    id: readString(data, "id") || `step${index}`,
    title: readString(data, "title"),
    notes: readString(data, "notes"),
    workGroupId: readOptionalString(data, "workGroupId"),
    memberId: readOptionalString(data, "memberId"),
    due: readDue(readMap(data, "due")),
    needsApproval: readBoolean(data, "needsApproval"),
    tagIds: readStringList(data, "tagIds"),
    posts: readPosts(data),
    checklist: readChecklist(data),
    links: readLinks(data),
    asksForLiveLink: readBoolean(data, "asksForLiveLink"),
  };
}

export function readSteps(data: DocumentData): WorkflowStep[] {
  return readList(data, "steps").map(readStep);
}
// #endregion

export const workflowConverter = createConverter<WorkflowRecord>({
  parse: (id, data) => ({
    id,
    name: readString(data, "name"),
    description: readString(data, "description"),
    eventTypeId: readOptionalString(data, "eventTypeId"),
    archived: readBoolean(data, "archived"),
    steps: readSteps(data),
    createdAt: readDate(data, "createdAt"),
    updatedAt: readDate(data, "updatedAt"),
  }),
  serialize: (workflow) => ({
    name: workflow.name,
    description: workflow.description,
    eventTypeId: workflow.eventTypeId,
    archived: workflow.archived,
    steps: workflow.steps,
    createdAt: fromDate(workflow.createdAt),
    updatedAt: fromDate(workflow.updatedAt),
  }),
});

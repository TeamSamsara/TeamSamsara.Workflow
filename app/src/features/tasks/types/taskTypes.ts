// File : /TeamSamsara.Workflow/app/src/features/tasks/types/taskTypes.ts
// Version : 1.1.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : A task: something one work group or person has to do by a time.
// It has the same basics and sections as a workflow's task, plus where it is
// (its status), its ticked checklist, the link to what was published, and its
// approval. Tasks made from an event remember the event and workflow step.

import type { DocumentData } from "firebase/firestore";
import {
  createConverter,
  fromDate,
  readBoolean,
  readDate,
  readOptionalString,
  readString,
  readStringList,
} from "@/core/data";
import {
  readStep,
  type PlatformPost,
  type ReferenceLink,
} from "@/features/workflows";

export interface TaskChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskRecord {
  id: string;
  title: string;
  notes: string;
  workGroupId: string | null;
  memberId: string | null;
  /** When it's due; null when it has no due time. */
  dueAt: Date | null;
  statusId: string;
  needsApproval: boolean;
  tagIds: string[];
  posts: PlatformPost[] | null;
  checklist: TaskChecklistItem[] | null;
  links: ReferenceLink[] | null;
  asksForLiveLink: boolean;
  /** The link to what was published, once added. */
  liveLink: string | null;
  // Where it came from: null for a task made on its own.
  eventId: string | null;
  workflowId: string | null;
  stepId: string | null;
  // Approval
  sentForReviewBy: string | null;
  sentForReviewAt: Date | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  /** What the approver asked to change, until it's sent for review again. */
  changesRequested: string | null;
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  /** Set when it moves to a finished or closed status; null while it's still to do. */
  doneAt: Date | null;
  /** Made after its due time had passed (planned late), so it's late through no one's fault. */
  lateAtCreation: boolean;
  /** Who marked it done or closed it; null while open, or for tasks done before this was kept. */
  doneBy: string | null;
  /** Kept as history when its event was deleted: what the event was. */
  eventGone: { title: string; startsAt: Date | null } | null;
}

/** The part of a task its edit form changes. */
export type TaskFields = Pick<
  TaskRecord,
  | "title"
  | "notes"
  | "workGroupId"
  | "memberId"
  | "dueAt"
  | "needsApproval"
  | "tagIds"
  | "posts"
  | "checklist"
  | "links"
  | "asksForLiveLink"
>;

export const TaskLimits = {
  title: 120,
  notes: 2000,
  changesNote: 500,
  liveLink: 500,
} as const;

function readChecklist(data: DocumentData): TaskChecklistItem[] | null {
  if (!Array.isArray(data.checklist)) return null;
  return (data.checklist as unknown[]).flatMap((entry, index) => {
    if (typeof entry !== "object" || entry === null) return [];
    const item = entry as DocumentData;
    return [
      {
        id: readString(item, "id") || `item${index}`,
        text: readString(item, "text"),
        done: readBoolean(item, "done"),
      },
    ];
  });
}

function readEventGone(data: DocumentData): TaskRecord["eventGone"] {
  const value: unknown = data.eventGone;
  if (typeof value !== "object" || value === null) return null;
  const gone = value as DocumentData;
  return {
    title: readString(gone, "title"),
    startsAt: readDate(gone, "startsAt"),
  };
}

function parse(id: string, data: DocumentData): TaskRecord {
  // The shared parts read the same way as a workflow's task.
  const step = readStep(data, 0);
  return {
    id,
    title: step.title,
    notes: step.notes,
    workGroupId: step.workGroupId,
    memberId: step.memberId,
    dueAt: readDate(data, "dueAt"),
    statusId: readString(data, "statusId"),
    needsApproval: step.needsApproval,
    tagIds: readStringList(data, "tagIds"),
    posts: step.posts,
    checklist: readChecklist(data),
    links: step.links,
    asksForLiveLink: step.asksForLiveLink,
    liveLink: readOptionalString(data, "liveLink"),
    eventId: readOptionalString(data, "eventId"),
    workflowId: readOptionalString(data, "workflowId"),
    stepId: readOptionalString(data, "stepId"),
    sentForReviewBy: readOptionalString(data, "sentForReviewBy"),
    sentForReviewAt: readDate(data, "sentForReviewAt"),
    approvedBy: readOptionalString(data, "approvedBy"),
    approvedAt: readDate(data, "approvedAt"),
    changesRequested: readOptionalString(data, "changesRequested"),
    createdBy: readString(data, "createdBy"),
    createdAt: readDate(data, "createdAt"),
    updatedAt: readDate(data, "updatedAt"),
    doneAt: readDate(data, "doneAt"),
    lateAtCreation: readBoolean(data, "lateAtCreation"),
    doneBy: readOptionalString(data, "doneBy"),
    eventGone: readEventGone(data),
  };
}

export const taskConverter = createConverter<TaskRecord>({
  parse,
  serialize: (task) => ({
    ...Object.fromEntries(Object.entries(task).filter(([key]) => key !== "id")),
    dueAt: fromDate(task.dueAt),
    sentForReviewAt: fromDate(task.sentForReviewAt),
    approvedAt: fromDate(task.approvedAt),
    createdAt: fromDate(task.createdAt),
    updatedAt: fromDate(task.updatedAt),
    doneAt: fromDate(task.doneAt),
    eventGone: task.eventGone
      ? {
          title: task.eventGone.title,
          startsAt: fromDate(task.eventGone.startsAt),
        }
      : null,
  }),
});

// File : /TeamSamsara.Workflow/functions/src/engineData.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Reads workflows, events and tasks from the database into the
// shapes the engine works with, and the workspace's formats (time zone,
// clock, date format, fields, names) so text fills exactly as in the app.
// Also writes many changes in batches.

import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type Firestore,
} from "firebase-admin/firestore";
import type {
  ChecklistItem,
  DueOffset,
  EventForTasks,
  Formats,
  PlannedTask,
  PlatformPost,
  ReferenceLink,
  StepForTasks,
  TaskChecklistItem,
  TaskForSync,
} from "../../engine/src/index.js";

const toDate = (value: unknown): Date | null =>
  value instanceof Timestamp ? value.toDate() : null;
const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;
const str = (value: unknown): string => (typeof value === "string" ? value : "");
const list = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
const records = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is Record<string, unknown> =>
          typeof entry === "object" && entry !== null,
      )
    : [];
const num = (value: unknown) => (typeof value === "number" ? value : 0);

function readDue(value: unknown): DueOffset {
  const due = (value ?? {}) as Record<string, unknown>;
  const direction =
    due.direction === "before" || due.direction === "after"
      ? due.direction
      : "at";
  return {
    direction,
    days: num(due.days),
    hours: num(due.hours),
    minutes: num(due.minutes),
    time: text(due.time),
  };
}

function readPosts(value: unknown): PlatformPost[] | null {
  if (!Array.isArray(value)) return null;
  return records(value).map((post) => ({
    platformId: str(post.platformId),
    formatId: text(post.formatId),
    texts: Object.fromEntries(
      Object.entries((post.texts ?? {}) as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    ),
  }));
}

function readItems(value: unknown): ChecklistItem[] | null {
  if (!Array.isArray(value)) return null;
  return records(value).map((item) => ({
    id: str(item.id),
    text: str(item.text),
  }));
}

function readTicks(value: unknown): TaskChecklistItem[] | null {
  if (!Array.isArray(value)) return null;
  return records(value).map((item) => ({
    id: str(item.id),
    text: str(item.text),
    done: item.done === true,
  }));
}

function readLinks(value: unknown): ReferenceLink[] | null {
  if (!Array.isArray(value)) return null;
  return records(value).map((link) => ({
    label: str(link.label),
    url: str(link.url),
  }));
}

export interface WorkflowData {
  id: string;
  name: string;
  steps: StepForTasks[];
}

export function readWorkflow(id: string, data: DocumentData): WorkflowData {
  return {
    id,
    name: text(data.name) ?? "A workflow",
    steps: records(data.steps).map((step) => ({
      id: str(step.id),
      title: str(step.title),
      notes: str(step.notes),
      workGroupId: text(step.workGroupId),
      memberId: text(step.memberId),
      due: readDue(step.due),
      needsApproval: step.needsApproval === true,
      tagIds: list(step.tagIds),
      posts: readPosts(step.posts),
      checklist: readItems(step.checklist),
      links: readLinks(step.links),
      asksForLiveLink: step.asksForLiveLink === true,
    })),
  };
}

export interface EventRow extends EventForTasks {
  id: string;
  workflowIds: string[];
  createdBy: string;
}

export function readEvent(id: string, data: DocumentData): EventRow {
  return {
    id,
    title: str(data.title),
    startsAt: toDate(data.startsAt) ?? new Date(0),
    endsAt: toDate(data.endsAt) ?? undefined,
    eventTypeId: text(data.eventTypeId),
    link: text(data.link),
    details: Object.fromEntries(
      Object.entries((data.details ?? {}) as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    ),
    workflowIds: list(data.workflowIds),
    createdBy: str(data.createdBy),
  };
}

export interface TaskRow extends TaskForSync {
  eventId: string | null;
  workflowId: string | null;
  stepId: string | null;
}

/** Never touched since it was made: still in its first status, never saved. */
function untouched(data: DocumentData): boolean {
  const made = toDate(data.createdAt)?.getTime();
  const saved = toDate(data.updatedAt)?.getTime();
  return made !== undefined && saved !== undefined && saved - made < 2000;
}

export function readTask(id: string, data: DocumentData): TaskRow {
  return {
    id,
    title: str(data.title),
    notes: str(data.notes),
    workGroupId: text(data.workGroupId),
    memberId: text(data.memberId),
    dueAt: toDate(data.dueAt),
    checklist: readTicks(data.checklist),
    posts: readPosts(data.posts),
    doneAt: toDate(data.doneAt),
    editedParts: Array.isArray(data.editedParts) ? list(data.editedParts) : null,
    touched: !untouched(data),
    eventId: text(data.eventId),
    workflowId: text(data.workflowId),
    stepId: text(data.stepId),
  };
}

/** The workspace's formats, as the app's useTaskFormats builds them. */
export async function engineFormats(db: Firestore): Promise<Formats> {
  const [workspace, fields, members, eventTypes] = await Promise.all([
    db.doc("config/workspace").get(),
    db.collection("fields").get(),
    db.collection("members").get(),
    db.collection("eventTypes").get(),
  ]);
  const data = workspace.data() ?? {};
  const names = new Map(
    members.docs.map((doc) => {
      const member = doc.data();
      return [
        doc.id,
        text(member.gameName)?.trim() ??
          text(member.displayName)?.trim() ??
          str(member.email),
      ];
    }),
  );
  const types = new Map(
    eventTypes.docs.map((doc) => [doc.id, str(doc.data().name)]),
  );
  const dateFormat = ["monthDay", "dayMonth", "isoDate"].includes(
    str(data.dateFormat),
  )
    ? (str(data.dateFormat) as Formats["dateFormat"])
    : "weekdayMonthDay";
  return {
    timeZone: text(data.timeZone) ?? "America/Toronto",
    clock: data.timeFormat === "24h" ? "24h" : "12h",
    dateFormat,
    fields: fields.docs.map((doc) => ({
      id: doc.id,
      name: str(doc.data().name),
      type: str(doc.data().type) || "text",
    })),
    memberName: (id) => names.get(id) ?? null,
    eventTypeName: (id) => types.get(id) || null,
  };
}

/** The first open status, where new tasks start. */
export async function startingStatusId(db: Firestore): Promise<string | null> {
  const statuses = await db.collection("statuses").get();
  const open = statuses.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as DocumentData)
    .filter((status) => status.category === "open")
    .sort((a, b) => num(a.position) - num(b.position));
  return (open[0]?.id as string | undefined) ?? null;
}

const stamp = (date: Date | null | undefined) =>
  date ? Timestamp.fromDate(date) : null;

/** A new task's document, the way the app's newTaskData writes one. */
export function newTaskDoc(
  planned: PlannedTask,
  event: EventRow,
  statusId: string,
  createdBy: string,
  now: Date,
): DocumentData {
  return {
    title: planned.title.trim(),
    notes: planned.notes.trim(),
    workGroupId: planned.workGroupId,
    memberId: planned.memberId,
    dueAt: stamp(planned.dueAt),
    needsApproval: planned.needsApproval,
    tagIds: planned.tagIds,
    posts: planned.posts,
    checklist:
      planned.checklist
        ?.map((item) => ({ ...item, text: item.text.trim() }))
        .filter((item) => item.text.length > 0) ?? null,
    links: planned.links,
    asksForLiveLink: planned.asksForLiveLink,
    statusId,
    liveLink: null,
    eventId: event.id,
    workflowId: planned.workflowId,
    stepId: planned.stepId,
    sentForReviewBy: null,
    sentForReviewAt: null,
    approvedBy: null,
    approvedAt: null,
    changesRequested: null,
    createdBy,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    doneAt: null,
    lateAtCreation: planned.dueAt !== null && planned.dueAt < now,
    editedParts: [],
  };
}

/** The same id the app gives an event's task, so it's never made twice. */
export const eventTaskId = (
  eventId: string,
  workflowId: string,
  stepId: string,
) => `${eventId}_${workflowId}_${stepId}`;

/** Firestore takes at most 500 writes per batch. */
export async function commitInBatches(
  db: Firestore,
  writes: readonly ((batch: FirebaseFirestore.WriteBatch) => void)[],
): Promise<void> {
  for (let start = 0; start < writes.length; start += 400) {
    const batch = db.batch();
    writes.slice(start, start + 400).forEach((write) => write(batch));
    await batch.commit();
  }
}

/** A sync's changes as fields to update. */
export function syncUpdate(changes: Record<string, unknown>): DocumentData {
  const data: DocumentData = { updatedAt: FieldValue.serverTimestamp() };
  for (const [key, value] of Object.entries(changes)) {
    data[key] = value instanceof Date ? Timestamp.fromDate(value) : value;
  }
  return data;
}

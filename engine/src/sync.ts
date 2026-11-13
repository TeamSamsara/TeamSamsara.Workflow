// File : /TeamSamsara.Workflow/engine/src/sync.ts
// Version : 1.1.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Keeping a task in line with its workflow step. Given the task as
// it is and what its step makes for its event now, works out what to write,
// part by part: its due time, who it's given to, title, notes, checklist and
// post text. A part someone changed by hand stays. Tasks record the parts
// people change (editedParts); for older tasks that don't, a part counts as
// changed by hand when it no longer reads the way the step's previous version
// made it, or, with no previous version to go by, when the task was touched
// at all. Gaps (no one given it, no post text, a checklist item it doesn't
// have yet) are always filled. Finished tasks are never changed, and a due
// time isn't moved to one that has already passed. When a workflow is saved,
// only the parts its step changed are looked at.

import type {
  PlannedTask,
  PlatformPost,
  TaskChecklistItem,
} from "./tasks.js";

export const TaskParts = [
  "due",
  "assignee",
  "title",
  "notes",
  "checklist",
  "posts",
] as const;
export type TaskPart = (typeof TaskParts)[number];

/** As much of a task as keeping it in line reads. */
export interface TaskForSync {
  id: string;
  title: string;
  notes: string;
  workGroupId: string | null;
  memberId: string | null;
  dueAt: Date | null;
  checklist: TaskChecklistItem[] | null;
  posts: PlatformPost[] | null;
  doneAt: Date | null;
  /** The parts people changed; null for tasks from before this was kept. */
  editedParts: readonly string[] | null;
  /** For older tasks with no previous step to compare with: touched since made. */
  touched?: boolean;
}

export interface TaskChanges {
  title?: string;
  notes?: string;
  workGroupId?: string | null;
  memberId?: string | null;
  dueAt?: Date | null;
  checklist?: TaskChecklistItem[] | null;
  posts?: PlatformPost[] | null;
}

export type HeldReason = "edited" | "late";

export interface TaskSync {
  taskId: string;
  /** Its title now, to list it by. */
  title: string;
  /** Parts that change. */
  parts: TaskPart[];
  changes: TaskChanges;
  /** Parts that would change but stay, and why. */
  held: { part: TaskPart; reason: HeldReason }[];
  /** Its due time before and after, when that moves. */
  fromDue?: Date | null;
  toDue?: Date | null;
}

const time = (date: Date | null | undefined) => date?.getTime() ?? null;

function samePosts(
  a: readonly PlatformPost[] | null,
  b: readonly PlatformPost[] | null,
): boolean {
  const left = a ?? [];
  const right = b ?? [];
  return (
    left.length === right.length &&
    left.every((post, index) => {
      const other = right[index];
      const keys = Object.keys(post.texts);
      return (
        post.platformId === other.platformId &&
        (post.formatId ?? null) === (other.formatId ?? null) &&
        keys.length === Object.keys(other.texts).length &&
        keys.every((key) => post.texts[key] === other.texts[key])
      );
    })
  );
}

/** Same items and words, ticks aside. */
function sameItems(
  a: readonly { id: string; text: string }[] | null,
  b: readonly { id: string; text: string }[] | null,
): boolean {
  const left = a ?? [];
  const right = b ?? [];
  return (
    left.length === right.length &&
    left.every(
      (item, index) =>
        item.id === right[index].id && item.text === right[index].text,
    )
  );
}

const sameTicks = (
  a: readonly TaskChecklistItem[] | null,
  b: readonly TaskChecklistItem[] | null,
) =>
  sameItems(a, b) &&
  (a ?? []).every((item, index) => item.done === b?.[index].done);

/**
 * The step's checklist with the task's ticks. Items the task has that the step
 * never had (added by hand) stay at the end; with a previous version to go by,
 * items the step dropped go.
 */
function mergeChecklist(
  task: TaskForSync,
  next: PlannedTask,
  previous: PlannedTask | null,
): TaskChecklistItem[] | null {
  if (!next.checklist) return task.checklist;
  const fromStep = new Set(next.checklist.map((item) => item.id));
  const stepHad = new Set(previous?.checklist?.map((item) => item.id) ?? []);
  return [
    ...next.checklist.map((item) => ({
      ...item,
      done: task.checklist?.find((own) => own.id === item.id)?.done ?? false,
    })),
    ...(task.checklist ?? []).filter(
      (item) => !fromStep.has(item.id) && !stepHad.has(item.id),
    ),
  ];
}

/** Only adds what's missing: the step's items the task doesn't have yet. */
function fillChecklist(
  task: TaskForSync,
  next: PlannedTask,
): TaskChecklistItem[] | null {
  if (!next.checklist) return task.checklist;
  const has = new Set((task.checklist ?? []).map((item) => item.id));
  const missing = next.checklist.filter((item) => !has.has(item.id));
  return missing.length === 0
    ? task.checklist
    : [...(task.checklist ?? []), ...missing];
}

export interface SyncOptions {
  now: Date;
}

/**
 * What to write to a task so it follows its step. `previous` is what the
 * step's previous version made for the same event (null when unknown).
 * Returns null when nothing changes or the task is finished.
 */
export function planTaskSync(
  task: TaskForSync,
  next: PlannedTask,
  previous: PlannedTask | null,
  { now }: SyncOptions,
): TaskSync | null {
  if (task.doneAt) return null;
  const changes: TaskChanges = {};
  const parts: TaskPart[] = [];
  const held: TaskSync["held"] = [];

  /** Whether a part is someone's own: recorded, or worked out for older tasks. */
  const edited = (part: TaskPart, readsAsMade: boolean) => {
    if (task.editedParts) return task.editedParts.includes(part);
    if (previous) return !readsAsMade;
    return task.touched ?? true;
  };
  /** With a previous version: whether the step changed this part at all. */
  const stepChanged = (same: boolean) => previous === null || !same;
  const take = (part: TaskPart, isEdited: boolean, write: () => void) => {
    if (isEdited) held.push({ part, reason: "edited" });
    else {
      write();
      parts.push(part);
    }
  };

  // Due time.
  if (
    time(next.dueAt) !== time(task.dueAt) &&
    stepChanged(time(previous?.dueAt) === time(next.dueAt))
  ) {
    const isEdited = edited("due", time(previous?.dueAt) === time(task.dueAt));
    const passed =
      next.dueAt !== null &&
      next.dueAt.getTime() < now.getTime() &&
      (task.dueAt === null || task.dueAt.getTime() >= now.getTime());
    if (!isEdited && passed) held.push({ part: "due", reason: "late" });
    else take("due", isEdited, () => (changes.dueAt = next.dueAt));
  }

  // Who it's given to; a task given to no one always takes the step's. A
  // step that names only a group keeps whoever in it took the task (handed
  // out, claimed, or given by a lead).
  const nobody = !task.workGroupId && !task.memberId;
  const takenInGroup =
    next.memberId === null &&
    next.workGroupId !== null &&
    next.workGroupId === task.workGroupId;
  if (
    !takenInGroup &&
    (next.workGroupId !== task.workGroupId ||
      next.memberId !== task.memberId) &&
    (nobody ||
      stepChanged(
        previous?.workGroupId === next.workGroupId &&
          previous?.memberId === next.memberId,
      ))
  ) {
    const isEdited =
      !nobody &&
      edited(
        "assignee",
        previous?.workGroupId === task.workGroupId &&
          previous?.memberId === task.memberId,
      );
    take("assignee", isEdited, () => {
      changes.workGroupId = next.workGroupId;
      changes.memberId = next.memberId;
    });
  }

  // Title and notes; empty notes always take the step's.
  if (next.title !== task.title && stepChanged(previous?.title === next.title))
    take("title", edited("title", previous?.title === task.title), () => {
      changes.title = next.title;
    });
  if (
    next.notes !== task.notes &&
    (task.notes.trim() === "" || stepChanged(previous?.notes === next.notes))
  ) {
    const isEdited =
      task.notes.trim() !== "" &&
      edited("notes", previous?.notes === task.notes);
    take("notes", isEdited, () => (changes.notes = next.notes));
  }

  // Checklist: follows the step, or at least gets the items it's missing.
  const merged = mergeChecklist(task, next, previous);
  const checklistChanged = stepChanged(
    sameItems(previous?.checklist ?? null, next.checklist),
  );
  if (!checklistChanged) {
    const filled = fillChecklist(task, next);
    if (!sameTicks(filled, task.checklist)) {
      changes.checklist = filled;
      parts.push("checklist");
    }
  } else if (!sameTicks(merged, task.checklist)) {
    const isEdited = edited(
      "checklist",
      sameItems(previous?.checklist ?? null, task.checklist),
    );
    if (!isEdited) take("checklist", false, () => (changes.checklist = merged));
    else {
      const filled = fillChecklist(task, next);
      if (!sameTicks(filled, task.checklist)) {
        changes.checklist = filled;
        parts.push("checklist");
      } else held.push({ part: "checklist", reason: "edited" });
    }
  }

  // Post text; a task with none always takes the step's.
  const noPosts = !task.posts || task.posts.length === 0;
  if (
    next.posts &&
    !samePosts(next.posts, task.posts) &&
    (noPosts || stepChanged(samePosts(previous?.posts ?? null, next.posts)))
  ) {
    const empty = noPosts;
    const isEdited =
      !empty && edited("posts", samePosts(previous?.posts ?? null, task.posts));
    take("posts", isEdited, () => (changes.posts = next.posts));
  }

  if (parts.length === 0 && held.length === 0) return null;
  return {
    taskId: task.id,
    title: task.title,
    parts,
    changes,
    held,
    ...(changes.dueAt !== undefined
      ? { fromDue: task.dueAt, toDue: changes.dueAt }
      : {}),
  };
}

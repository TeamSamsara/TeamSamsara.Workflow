// File : /TeamSamsara.Workflow/app/src/features/task-setup/ui/taskSetupContent.ts
// Version : 1.0.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : The words for the workspace's lists: what each status counts as,
// the list cards, and the dialogs for statuses, event types and tags.

import type { StatusCategory, StatusTone } from "@/core/data";

export const StatusCategoryText: Record<
  StatusCategory,
  { label: string; description: string }
> = {
  open: { label: "Open", description: "Still to do." },
  awaitingApproval: {
    label: "Waiting for approval",
    description: "Done, waiting for someone with Approve tasks to sign it off.",
  },
  finished: { label: "Finished", description: "Done." },
  closed: {
    label: "Closed, not done",
    description: "Won't be done: skipped or cancelled.",
  },
};

export const StatusToneText: Record<StatusTone, string> = {
  neutral: "Plain",
  info: "Blue",
  alert: "Amber",
  success: "Green",
  error: "Red",
  muted: "Grey",
};

export const SetupListText = {
  move: (name: string) =>
    `Move ${name}. Use the up and down arrow keys, or drag the row.`,
  edit: (name: string) => `Edit ${name}`,
  saving: "Saving the new order…",
  dragHint: "Drag to reorder.",
  orderFailed: "The new order couldn't be saved.",
} as const;

export const StatusDialogText = {
  newTitle: "New status",
  editTitle: (name: string) => `Edit ${name}`,
  name: "Name",
  namePlaceholder: "In progress",
  tone: "Colour",
  category: "Counts as",
  categoryHint:
    "How the app treats a task in this status: still to do, waiting for approval, done, or won't be done.",
  startsHere: "New tasks start here",
  blocked: {
    open: "There must always be at least one open status, for new tasks to start in.",
    finished:
      "There must always be at least one finished status, for done tasks.",
    awaitingApproval: "",
    closed: "",
  } satisfies Record<StatusCategory, string>,
} as const;

export const ColouredItemDialogText = {
  eventType: {
    newTitle: "New event type",
    editTitle: (name: string) => `Edit ${name}`,
    namePlaceholder: "Livestream",
    colorHint: "Colours the event on the calendar.",
    deleteNote:
      "Events of this type keep their details; they just lose the type.",
  },
  tag: {
    newTitle: "New tag",
    editTitle: (name: string) => `Edit ${name}`,
    namePlaceholder: "Sponsor",
    colorHint: "Shown on every task with this tag.",
    deleteNote: "Tasks with this tag just lose it.",
  },
} as const;

export const DialogText = {
  name: "Name",
  cancel: "Cancel",
  create: "Add",
  save: "Save",
  delete: "Delete",
  confirmDelete: (name: string) => `Delete ${name}? This can't be undone.`,
  added: (name: string) => `${name} added`,
  saved: (name: string) => `${name} saved`,
  deleted: (name: string) => `${name} deleted`,
} as const;

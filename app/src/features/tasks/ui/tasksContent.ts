// File : /TeamSamsara.Workflow/app/src/features/tasks/ui/tasksContent.ts
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : The words for tasks: rows and groups, the task page's cards, the
// moves a task can make, the edit form, and the new task and reassign dialogs.

import type { DueGroup } from "../model/groupByDue";

export const DueText = {
  today: "Today",
  tomorrow: "Tomorrow",
  yesterday: "Yesterday",
  at: (day: string, time: string) => `${day}, ${time}`,
  due: (when: string) => `Due ${when}`,
  noDue: "No due date",
  late: "Late",
} as const;

export const DueGroupText: Record<DueGroup, string> = {
  late: "Late",
  today: "Today",
  thisWeek: "This week",
  later: "Later",
  noDue: "No due date",
};

export const TaskRowText = {
  unassigned: "No one yet",
  open: (title: string) => `Open ${title}`,
} as const;

export const TaskProgressText = {
  label: "Where this task is",
  step: (index: number, name: string) => `${index}. ${name}`,
} as const;

export const TaskCardText = {
  howTo: "How to do it",
  noNotes: "No instructions yet.",
  links: "Links",
  posts: "Post text",
  copy: "Copy text",
  copied: "Copied",
  empty: "Nothing written for this platform yet.",
  fieldFor: (field: string, platform: string) => `${field} for ${platform}`,
  checklist: "Checklist",
  checklistProgress: (done: number, total: number) =>
    `${done} of ${total} done`,
  checklistSaveFailed: "That tick couldn't be saved",
} as const;

export const NextStepText = {
  title: "Next step",
  sendForReview: "Send for review",
  sendForReviewHint: "Someone with Approve tasks checks it before it's done.",
  markDone: "Mark as done",
  reopen: "Reopen",
  approve: "Approve",
  askForChanges: "Ask for changes",
  status: "Status",
  statusHelp: "You can edit any task, so you can also put it in any status.",
  nothing: "Nothing for you to do here.",
  doneOn: (when: string) => `Finished ${when}.`,
  liveLink: "Link to what was published",
  liveLinkPlaceholder: "https://",
  liveLinkHelp:
    "Paste the link to the post or video once it's live, so everyone can find it.",
  liveLinkInvalid: "That doesn't look like a web address.",
  saveLink: "Save link",
  linkSaved: "Link saved",
  needsLiveLink: "Add the link to what was published first.",
  noReviewStatus:
    'This task needs approval, but no status counts as "Waiting for approval". Add one in Settings → Tasks and events.',
  moved: {
    sendForReview: "Sent for review",
    markDone: "Marked as done",
    approve: "Approved",
    askForChanges: "Sent back with changes",
    reopen: "Reopened",
  },
  moveFailed: "That didn't work",
} as const;

export const ApprovalText = {
  title: "Approval",
  needed: "Needs approval from someone with Approve tasks before it's done.",
  sentBy: (name: string, when: string) =>
    `Sent for review by ${name} · ${when}`,
  approvedBy: (name: string, when: string) => `Approved by ${name} · ${when}`,
  waiting: "Waiting for someone to approve it.",
  changes: "Changes asked for",
  someone: "someone",
} as const;

export const AssignedText = {
  title: "Given to",
  anyoneInGroup: "anyone in the group",
  nobody: "No one yet.",
  reassign: "Reassign",
  createdBy: (name: string) => `Made by ${name}`,
} as const;

export const ReassignText = {
  title: "Reassign task",
  save: "Reassign",
  cancel: "Cancel",
  done: (title: string) => `${title} reassigned`,
} as const;

export const AskForChangesText = {
  title: "Ask for changes",
  note: "What needs changing?",
  placeholder: "Make the logos bigger, and add the match time.",
  send: "Send back",
  cancel: "Cancel",
} as const;

export const TaskFormText = {
  title: "Title",
  titlePlaceholder: "Sponsor post",
  notes: "How to do it",
  notesPlaceholder: "What to do, where to find things, what good looks like.",
  dueDate: "Due date",
  dueTime: "Time",
  dueHelp:
    "In the workspace's time zone. Leave the date empty for no due date.",
  noTime: "Pick a date first",
  needsApproval: "Needs approval",
  needsApprovalHelp:
    "Before it counts as done, someone with the Approve tasks permission checks it and signs it off.",
  titleRequired: "Give the task a title.",
  addSection: "Add section",
  removeSection: (name: string) => `Remove ${name}`,
} as const;

export const NewTaskText = {
  title: "New task",
  description:
    "A one-off task, not part of an event. You can add post text, a checklist and links once it's made.",
  create: "Create task",
  cancel: "Cancel",
  created: (title: string) => `${title} created`,
  noStatuses:
    "Add statuses in Settings → Tasks and events before making tasks.",
} as const;

export const GiveToText = {
  giveTo: "Give to",
  giveToHelp:
    "Pick a work group and anyone in it can take the task, or pick one person. To give it to someone in a group, pick the group, then the person.",
  whoInGroup: (group: string) => `Who in ${group}`,
  anyoneInGroup: (group: string) => `Anyone in ${group}`,
} as const;

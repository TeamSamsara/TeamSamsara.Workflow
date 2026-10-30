// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/workflowsContent.ts
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : The words for the workflows list and editor: the table, the task
// list, each task's fields and sections, due times, and the gaps card.

import type { DueDirection } from "../types/workflowTypes";

export const WorkflowsTableText = {
  caption: "Workflows",
  name: "Name",
  description: "What it's for",
  tasks: "Tasks",
  groups: "Work groups",
  updated: "Last changed",
  noGroups: "None",
  noDescription: "No description",
  open: (name: string) => `Open ${name}`,
  openColumn: "Open",
  none: "No workflows here.",
} as const;

export const StepListText = {
  title: "Tasks",
  description: "Made for each event this workflow is used on, in this order.",
  add: "Add task",
  full: (max: number) => `A workflow holds up to ${max} tasks.`,
  empty: "No tasks yet. Add the first thing that needs doing for an event.",
  untitled: "Untitled task",
  number: (index: number) => `${index + 1}.`,
  move: (title: string) =>
    `Move ${title}. Use the up and down arrow keys, or drag the row.`,
  open: (title: string) => `Edit ${title}`,
  close: (title: string) => `Close ${title}`,
  needsApproval: "Needs approval",
  unassigned: "Not given to anyone",
  problems: "Needs fixing",
} as const;

export const StepEditorText = {
  title: "Title",
  titlePlaceholder: "Go-live post",
  notes: "How to do it",
  notesPlaceholder: "What to do, where to find things, what good looks like.",
  workGroup: "Work group",
  member: "Person",
  nobody: "No one",
  noGroup: "No group",
  assignHint:
    "A group's task shows for everyone in it; pick a person too to give it to them.",
  due: "Due",
  tags: "Tags",
  addTag: "Add tag",
  noTags: "No tags yet. Make them in Settings → Tasks and events.",
  removeTag: (name: string) => `Remove ${name}`,
  noTagsOnTask: "None",
  sections: "Sections",
  addSection: "Add section",
  removeSection: (name: string) => `Remove ${name}`,
  needsApproval: "Needs approval before it's done",
  needsApprovalHint: "Someone with Approve tasks signs it off.",
  duplicate: "Duplicate",
  remove: "Delete task",
  gapsHint: "Gaps like {guest} fill from the event's details.",
} as const;

export const SectionText = {
  posts: {
    name: "Post text",
    description:
      "What to post, per platform. Counts use each platform's limit.",
  },
  checklist: {
    name: "Checklist",
    description: "Steps to tick off while doing the task.",
  },
  links: {
    name: "Reference links",
    description: "Examples, folders, briefs.",
  },
  liveLink: {
    name: "Link to what was published",
    description:
      "Whoever does the task adds the link to the live post or video before marking it done.",
  },
} as const;

export const PostTextEditorText = {
  platforms: "Platforms",
  addPlatform: "Add platform",
  allAdded: "Every switched-on platform is added.",
  noPlatforms:
    "No platforms are switched on. Turn them on in Settings → Platforms.",
  none: "Add the platforms this post goes on.",
  removePlatform: (name: string) => `Remove ${name}`,
  fieldLabel: (field: string, platform: string) => `${field} for ${platform}`,
  format: "Kind of post",
  normalPost: "Post",
  count: (count: number, max: number) =>
    `${count.toLocaleString()} / ${max.toLocaleString()}`,
  overBy: (count: number) => `${count.toLocaleString()} over`,
} as const;

export const ChecklistEditorText = {
  item: (index: number) => `Item ${index + 1}`,
  placeholder: "Add the stream link to the description",
  add: "Add item",
  remove: (index: number) => `Remove item ${index + 1}`,
  none: "No items yet.",
} as const;

export const ReferenceLinksText = {
  none: "No links yet.",
  labelPlaceholder: "Example thumbnail",
} as const;

export const DueFieldText = {
  directions: {
    before: "Before the start",
    at: "At the start",
    after: "After the start",
  } satisfies Record<DueDirection, string>,
  days: "Days",
  hours: "Hours",
  minutes: "Minutes",
  atTime: "At a set time",
  time: "Time",
} as const;

export const GapsCardText = {
  title: "Event details it uses",
  description: "Gaps in the tasks' text that fill from the event.",
  fromEvent: "From the event",
  asked: "Asked when the event is planned",
  none: "No gaps yet. Type one like {title} or {guest} in a task's text.",
  builtIn: "{title}, {date}, {time} and {link} come from the event itself.",
} as const;

export const AboutCardText = {
  title: "About",
  name: "Name",
  namePlaceholder: "Livestream",
  description: "What it's for",
  descriptionPlaceholder: "Before, during and after a stream.",
  eventType: "Suggest for event type",
  anyEvent: "Any event",
  eventTypeHint: "Offered first when planning an event of this type.",
  noEventTypes: "Add event types in Settings → Tasks and events.",
} as const;

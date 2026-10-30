// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/workflowsContent.ts
// Version : 1.1.0
// Latest commit: fix/workflow-editor-simpler
// Author : Gerrah
// Purpose : The words for the workflows list and editor: the table, the task
// list, each task's fields and sections, due times, and the gaps card.

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
  help: "Each time this workflow is used on an event, these tasks are made for it, with their due times worked out from the event's start.",
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
  giveTo: "Give to",
  giveToHelp:
    "Pick a work group and anyone in it can take the task, or pick one person. To give it to someone in a group, pick the group, then the person.",
  nobody: "No one yet",
  groups: "Work groups",
  people: "People",
  whoInGroup: (group: string) => `Who in ${group}`,
  anyoneInGroup: (group: string) => `Anyone in ${group}`,
  due: "Due",
  dueHelp:
    'Counted from when the event starts. On a Saturday 7:00 PM stream, "The day before" is Friday at 7:00 PM.',
  tags: "Tags",
  addTag: "Add tag",
  noTags: "No tags yet. Make them in Settings → Tasks and events.",
  noTagsOnTask: "None",
  removeTag: (name: string) => `Remove ${name}`,
  addSection: "Add section",
  removeSection: (name: string) => `Remove ${name}`,
  needsApproval: "Needs approval",
  needsApprovalHelp:
    "Before it counts as done, someone with the Approve tasks permission checks it and signs it off.",
  duplicate: "Duplicate",
  remove: "Delete task",
} as const;

export const SectionText = {
  posts: {
    name: "Post text",
    description: "What to post on each platform.",
    help: "Write the text for each platform. The count uses that platform's limit. Gaps like {title} or {guest} fill in from the event's details.",
  },
  checklist: {
    name: "Checklist",
    description: "Steps to tick off while doing it.",
    help: "Small steps the person ticks off as they go. Press Enter in the last item to add another.",
  },
  links: {
    name: "Reference links",
    description: "Examples, folders, briefs.",
    help: "Links the person will need: an example to follow, the folder to save to, a brief.",
  },
  liveLink: {
    name: "Link to what was published",
    description: "Asks for the link to the live post or video.",
    help: "Before marking the task done, the person pastes the link to what went live, so everyone can find it later.",
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
  custom: "Custom…",
  at: "At",
  eventTime: "Same time as the event",
  amount: "How long",
  unit: "Unit",
  units: { minutes: "Minutes", hours: "Hours", days: "Days" },
  direction: "Before or after",
  directions: {
    before: "Before the event starts",
    after: "After the event starts",
  },
  summary: (due: string) => `Due: ${due}.`,
} as const;

export const GapsCardText = {
  title: "Event details it uses",
  help: "Type a gap like {guest} in a task's title, notes, checklist or post text. When the workflow is used on an event, the gap is filled in from that event.",
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
  eventTypeHelp:
    "When someone plans an event of this type, this workflow is offered first.",
  noEventTypes: "Add event types in Settings → Tasks and events.",
} as const;

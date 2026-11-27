// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/workflowsContent.ts
// Version : 1.6.0
// Latest commit: feature/1.2-flow-view
// Author : Gerrah
// Purpose : The words for the workflows list and editor: the table, the steps
// list, each step's six parts, order rules, extras, the rail beside it, due
// times, and the gaps card.

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

export const StepNavText = {
  label: "Workflow parts",
  about: "About this workflow",
  aboutMeta: "Name, what it's for, fields it uses",
  needsFixing: "Needs fixing",
  title: "Steps",
  inDueOrder: "In due order",
  empty: "No steps yet. Add the first thing that needs doing for an event.",
  untitled: "Untitled step",
  number: (index: number) => `${index + 1}.`,
  high: "High priority",
  problems: (count: number) =>
    count === 1 ? "1 thing to fix" : `${count} things to fix`,
  rules: (count: number) =>
    count === 1 ? "1 order rule" : `${count} order rules`,
  add: "Add a step",
  full: (max: number) => `A workflow holds up to ${max} steps.`,
} as const;

export const StepEditorText = {
  untitled: "Untitled step",
  everyPart:
    "Every step has the same six parts. Each time this workflow is used on an event, the step becomes a task.",
  parts: {
    what: "What",
    who: "Who",
    when: "When",
    order: "Order",
    priority: "Priority and approval",
    extras: "Extras",
  },
  title: "Title",
  titlePlaceholder: "Announcement post",
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
  anyoneIn: (group: string) => `anyone in ${group}`,
  groupLeastBusy: (group: string) => `${group}'s least busy person`,
  leastBusy: "Whoever's least busy and free",
  lead: (name: string) => `${name} (lead)`,
  aboveRank: (name: string) => `${name} (above your rank)`,
  whoNamed: (name: string, group: string) =>
    `On each event this step goes to ${name}. If ${name} leaves ${group}, it goes back to the group.`,
  whoHandedOut: (group: string) =>
    `${group} hands out its tasks: on each event this step goes to whoever's least busy and free, or waits for someone in ${group} to claim it.`,
  whoAnyone: (group: string) =>
    `Anyone in ${group} can take it. To hand tasks to one person at a time, turn on Hand out tasks automatically for ${group}.`,
  due: "Due",
  dueHelp:
    'Counted from when the event starts. For an event on Monday at 7:00 PM, "The day before" is Sunday at 7:00 PM. A Due from rule counts from another step instead.',
  priority: "Priority",
  priorities: { high: "High", normal: "Normal", low: "Low" },
  priorityHint:
    "Sorts My tasks. High priority tasks come first among the ones due at the same time.",
  approval: "Approval",
  noApproval: "No approval needed",
  needsApproval: "Needs approval",
  needsApprovalHelp:
    "Before it counts as done, someone with the Approve tasks permission checks it and signs it off.",
  extrasHelp: "Add only what this step needs.",
  tags: "Tags",
  addTag: "Add tag",
  noTags: "No tags yet. Make them in Settings → Tasks and events.",
  noTagsOnTask: "None",
  removeTag: (name: string) => `Remove ${name}`,
  duplicate: "Duplicate",
  remove: "Delete step",
} as const;

export const OrderFieldText = {
  label: "Order rules",
  help: "Each rule reads left to right: how this step relates to another, which step, and what has to happen first.",
  how: "How",
  which: "Step",
  what: "What has to happen",
  ruleHow: (index: number) => `Rule ${index + 1}: how it relates`,
  ruleWhich: (index: number) => `Rule ${index + 1}: which step`,
  ruleWhat: (index: number) => `Rule ${index + 1}: what has to happen`,
  chooseStep: "Choose a step",
  untitled: (index: number) => `Step ${index + 1}`,
  remove: (index: number) => `Remove rule ${index + 1}`,
  none: "No order rules. This step unlocks as soon as the event's tasks are made, and only its due time sets when it's done.",
  add: "Add a rule",
  waitFor: "When it waits on several steps",
  waitForAll: "Wait for all of them",
  waitForAny: "Unlock when any one is done",
  waitForOne: "It waits on one step.",
  whenLate: "When what it waits on is late",
  whenLateWait: "Keep waiting",
  whenLateUnlock: "Unlock at its own due time",
} as const;

export const ExtrasText = {
  label: "Extras",
  noPlatforms: "No platforms yet",
  items: (count: number) => (count === 1 ? "1 item" : `${count} items`),
  links: (count: number) => (count === 1 ? "1 link" : `${count} links`),
  liveLinkOn: "Asked before it's marked done",
  off: "Off",
  tags: "Tags",
  noTags: "No tags",
  noneYet: "Not added",
  close: "Close",
  edit: "Edit",
  add: "Add",
  remove: (name: string) => `Remove ${name.toLowerCase()}`,
} as const;

export const StepRailText = {
  label: "About this step",
  readsAs: "Reads as",
  inFlow: "In the flow",
  comesFirst: "Comes first",
  comesAfter: "Comes after this",
  hasToHappen: "Has to happen first",
  onlyOrder: "Only the order",
  noLinks: "Not linked to other steps.",
  checks: "Checks",
  fix: "Make it due 1 hour later",
  open: (name: string) => `Open ${name}`,
  elsewhere: "Other steps",
  passing: [
    "No loops",
    "Each step is due after the ones it comes after",
    "Every condition can be met",
  ],
  pickStep: "Pick a step to see how it reads and where it sits in the flow.",
} as const;

export const SectionText = {
  posts: {
    name: "Post text",
    description: "What to post on each platform.",
    help: "Write the text for each platform. The count uses that platform's limit. Fields like {title} or {sponsor} fill in from the event.",
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
  placeholder: "Tag the sponsor's account",
  add: "Add item",
  remove: (index: number) => `Remove item ${index + 1}`,
  none: "No items yet.",
} as const;

export const ReferenceLinksText = {
  none: "No links yet.",
  labelPlaceholder: "Brand kit",
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
  title: "Fields it uses",
  help: "Write a field like {opponent} in a task's title, notes, checklist or post text. When the workflow is used on an event, it's filled in from that event. Set up fields in Settings › Fields.",
  fromEvent: "From the event",
  asked: "Asked when the event is planned",
  none: "No fields yet. Write one like {title} or {opponent} in a task's text.",
  builtIn:
    "{title}, {date}, {time}, {end_time}, {link} and {event_type} come from the event itself.",
  notAField: "Not set up as a field yet, so it's asked for as text.",
} as const;

export const AboutCardText = {
  title: "About",
  name: "Name",
  namePlaceholder: "Content drop",
  description: "What it's for",
  descriptionPlaceholder: "Everything around a new video or post.",
  eventType: "Suggest for event type",
  anyEvent: "Any event",
  eventTypeHelp:
    "When someone plans an event of this type, this workflow is offered first.",
  noEventTypes: "Add event types in Settings → Tasks and events.",
} as const;

export const FlowChartText = {
  eventStarts: "Event starts",
  dragToLink: "Drag onto another step to link them",
  changeLink: "Change or remove this link",
  hard: "Has to happen first",
  soft: "Only the order",
  bad: "Out of order",
} as const;

export const WorkflowFlowText = {
  label: "The workflow's steps as a flow",
  high: "High priority",
  problems: (count: number) =>
    count === 1 ? "1 problem" : `${count} problems`,
  howToLink:
    "Drag from a step's edge onto another step to link them. Click a link to make it Has to be done first or Only the order, or to remove it.",
  refused: "Those steps are already linked, or linking them would make a loop.",
  sideLabel: "The picked step",
  pick: "Pick a step to change when it's due, its order rules and its priority.",
  openStep: "Open the whole step",
  linkTitle: "Link",
  linkBetween: (from: string, to: string) => `${to} comes after ${from}.`,
  linkKind: "What has to happen",
  hardLink: "Has to be done first",
  softLink: "Nothing, only the order",
  removeLink: "Remove the link",
  checks: "Checks",
  passing: [
    "Steps come in order",
    "Every condition can be met",
    "Steps that need approval are due before the ones after them",
  ],
} as const;

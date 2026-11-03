// File : /TeamSamsara.Workflow/app/src/features/events/ui/planContent.ts
// Version : 1.2.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : The words for planning several events at once and for sets.

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;

export const PlanText = {
  nameRequired: "Give the set a name.",
  titleRequired: "Write the events' title.",
  rowsRequired: "Add at least one event.",
  tooManyRows: (limit: number) => `At most ${limit} events at once.`,
  titleTooLong: (limit: number) => `Titles are at most ${limit} characters.`,

  shared: "1 · What they share",
  name: "Name of the set",
  nameHelp: "Lets you find, move or delete them together later.",
  namePlaceholder: "Spring Split 2027",
  title: "Title",
  titlePlaceholder: "vs. {opponent}",
  titleHelp:
    "Words in {curly brackets} become a column below, filled in per event. The workflows' own fields join them.",
  type: "Event type",
  noType: "No type",
  usualStart: "Usual start",
  usualEnd: "Usual end",

  rowsTitle: "2 · The events",
  addPattern: "Add dates on a pattern",
  paste: "Paste from a spreadsheet",
  addRow: "Add a row",
  empty:
    "No events yet. Add dates on a pattern (every Saturday, say), paste them from a spreadsheet, or add rows one by one.",
  rowNumber: "#",
  date: "Date",
  start: "Start",
  end: "End",
  becomes: "Becomes",
  who: "Who can make it",
  remove: (row: number) => `Remove row ${row}`,
  removeColumn: "Remove",
  fillIn: "TBD",
  rowsCaption: "The events to make",
  whoEveryone: "Everyone",
  whoNobody: "—",
  whoFree: "Everyone free",
  whoSome: (free: number, total: number, names: string) =>
    `${free} of ${total} · ${names}`,
  tbdNote: (count: number) =>
    `${plural(count, "row")} ${count === 1 ? "has" : "have"} a field left as TBD. ${count === 1 ? "It's" : "They're"} made with the field still in the title, to fill in later on each event.`,

  summaryTitle: "This creates",
  events: "events",
  tasks: "tasks",
  summaryHelp: (workflows: string) =>
    workflows
      ? `Each event gets its own tasks from ${workflows}, due counted from its own start. Afterwards they're normal events: move or change any one alone.`
      : "Afterwards they're normal events: move or change any one alone.",
  busyRows: (count: number) =>
    `${plural(count, "date")} ${count === 1 ? "has" : "have"} someone busy or unavailable`,
  rowsToFix: (count: number) => plural(count, "row") + " to fix",

  page: "Plan several events",
  pageFor: (name: string) => `Add events to ${name}`,
  calendar: "Calendar",
  sets: "Sets",
  intro:
    "For anything with many dates that aren't all the same. Set what they share once, then add one row per event.",
  introAdd:
    "The new events join the set. They start with what its events were made with; change anything for these ones.",
  cancel: "Cancel",
  create: (events: number, tasks: number) =>
    tasks > 0
      ? `Create ${plural(events, "event")} and ${plural(tasks, "task")}`
      : `Create ${plural(events, "event")}`,
  createPlain: "Create events",
  created: (count: number, name: string) =>
    `${plural(count, "event")} added to ${name}`,
  failed: "Couldn't create the events",
  problems: "Some things need fixing before the events can be made.",
  noStatuses:
    "There's no task status to start tasks in. Add one in Settings › Tasks and events first.",
  notFound: "This set doesn't exist any more.",
  discard: {
    title: "Leave without creating?",
    body: "The events you've planned here aren't made yet and will be lost.",
    keep: "Keep planning",
    confirm: "Leave",
  },

  pattern: {
    title: "Add dates on a pattern",
    description: "Every week (or every few weeks) on the days you pick.",
    days: "On",
    every: "Every",
    weeks: (count: number) => (count === 1 ? "week" : `${count} weeks`),
    from: "From",
    until: "Until",
    start: "Start",
    end: "End",
    preview: (count: number) =>
      count === 0 ? "No dates match yet." : `Adds ${plural(count, "row")}.`,
    cancel: "Cancel",
    add: (count: number) =>
      count > 0 ? `Add ${plural(count, "row")}` : "Add rows",
  },

  pasteDialog: {
    title: "Paste from a spreadsheet",
    description:
      "Copy the rows from Google Sheets, Excel or the league's schedule and paste them here.",
    label: "Pasted rows",
    placeholder:
      "Sat Jan 9 2027\t5:00 PM\tTeam Nova\nSat Jan 16 2027\t5:00 PM\tKitsune",
    columns: "What each column is",
    column: (index: number) => `Column ${index + 1}`,
    ignore: "Leave out",
    date: "Date",
    start: "Start",
    end: "End",
    gap: (label: string) => `{${label}}`,
    firstRowHeader: "The first row names the columns",
    read: (count: number) => `${plural(count, "row")} read`,
    readHelp: (timeZone: string) =>
      `Dates and times are read in the workspace's time zone (${timeZone}). Columns fill the {fields} in the title.`,
    skipped: (lines: readonly number[]) =>
      `${lines.length === 1 ? "Line" : "Lines"} ${lines.join(", ")} ${lines.length === 1 ? "has" : "have"} no date that could be read and ${lines.length === 1 ? "is" : "are"} left out.`,
    unknown: (count: number) =>
      `${plural(count, "value")} ${count === 1 ? "says" : "say"} TBD or ${count === 1 ? "is" : "are"} empty. Those fields stay empty so you can fill them in later.`,
    noDate: "Pick which column holds the date.",
    cancel: "Cancel",
    add: (count: number) =>
      count > 0 ? `Add ${plural(count, "row")}` : "Add rows",
  },
} as const;

export const SetText = {
  sets: "Sets",
  setsDescription:
    "Groups of events planned together, so they can be found, moved or changed as one.",
  calendar: "Calendar",
  newSet: "Plan several events",
  noSets:
    "No sets yet. Plan several events at once from New event › Several events.",
  loading: "Loading",
  setsCaption: "Sets",
  name: "Name",
  type: "Type",
  madeBy: "Made by",
  made: "Made",
  noType: "No type",
  notFound: "This set doesn't exist any more.",

  events: (count: number) => plural(count, "event"),
  dates: (first: string, last: string) =>
    first === last ? first : `${first} – ${last}`,
  workflowsNone: "No workflows",
  more: (name: string) => `More for ${name}`,
  rename: "Rename",
  deleteSet: "Delete the set",
  moveSeveral: "Move…",
  deleteSeveral: "Delete…",
  addEvents: "Add events",
  played: "played",
  tasksDone: "tasks done",
  next: (title: string) => `next: ${title}`,
  nothingNext: "nothing coming up",
  allPast: "All done",
  tbd: (count: number) =>
    count === 1 ? "field still TBD" : "fields still TBD",
  noneTbd: "nothing TBD",
  eventsCaption: "Events in the set",
  select: (title: string) => `Select ${title}`,
  selectAll: "Select all",
  when: "When",
  event: "Event",
  tasks: "Tasks",
  progress: (done: number, total: number) =>
    total === 0
      ? "No tasks"
      : done === total
        ? "✓ All done"
        : `${done} of ${total} done`,
  tbdPill: "TBD",
  limited:
    "Only the events you can see show here. The set may have others for groups you're not in.",
  selected: (count: number) => `${plural(count, "event")} selected`,
  tickHelp:
    "Tick events to move or delete several at once. Each event's page says which set it's part of and links back here.",
  noEvents: "This set has no events left.",
  partOf: "Part of",

  renameDialog: {
    title: "Rename the set",
    label: "Name",
    cancel: "Cancel",
    save: "Save",
    saved: "Set renamed",
  },
  moveDialog: {
    title: (count: number) => `Move ${plural(count, "event")}`,
    description:
      "Moves each one by the same amount; their tasks move with them.",
    days: "Days",
    daysHelp: "Later, or negative for earlier.",
    minutes: "And",
    noMove: "Pick how far to move them.",
    cancel: "Cancel",
    move: "Move",
    moved: (count: number) => `${plural(count, "event")} moved`,
    shift: {
      "-120": "2 hours earlier",
      "-60": "1 hour earlier",
      "-30": "30 minutes earlier",
      "0": "the same time",
      "30": "30 minutes later",
      "60": "1 hour later",
      "120": "2 hours later",
    } as Record<string, string>,
  },
  deleteDialog: {
    title: (count: number) => `Delete ${plural(count, "event")}?`,
    body: (count: number) =>
      `${count === 1 ? "It's" : "They're"} deleted with ${count === 1 ? "its" : "their"} tasks, done or not. This can't be undone.`,
    cancel: "Cancel",
    confirm: "Delete",
    deleted: (count: number) => `${plural(count, "event")} deleted`,
  },
  deleteSetDialog: {
    title: (name: string) => `Delete ${name}?`,
    body: (count: number) =>
      count === 0
        ? "The set is deleted. It has no events left."
        : `The set and its ${plural(count, "event")} are deleted, with their tasks, done or not. This can't be undone.`,
    cancel: "Cancel",
    confirm: "Delete the set",
    deleted: (name: string) => `${name} deleted`,
  },
  failed: "Something went wrong",
} as const;

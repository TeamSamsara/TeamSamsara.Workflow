// File : /TeamSamsara.Workflow/app/src/features/availability/ui/availabilityContent.ts
// Version : 1.0.0
// Latest commit: feature/people-time
// Author : Gerrah
// Purpose : The words for availability, personal appointments and who can
// make an event.

export const WeekPainterText = {
  brush: "Brush",
  available: "Available",
  unavailable: "Unavailable",
  hours: (count: number) => `Available ${count} h a week`,
  cell: (day: string, hour: string, available: boolean) =>
    `${day} ${hour}, ${available ? "available" : "unavailable"}`,
  help: "Pick a brush, then click or drag across hours.",
} as const;

export const ExceptionsText = {
  title: "Exceptions",
  description:
    "Dates that aren't like your usual week: trips, exams, a free day.",
  none: "No exceptions.",
  add: "Add exception",
  remove: (date: string) => `Remove ${date}`,
  allDay: "All day",
  unavailable: "Unavailable",
  available: "Available",
  dialog: {
    title: "Add an exception",
    date: "Date",
    kind: "On that date I'm",
    allDay: "All day",
    from: "From",
    to: "To",
    timesWrong: "The end has to be after the start.",
    dateRequired: "Pick a date.",
    cancel: "Cancel",
    add: "Add",
  },
} as const;

export const PersonalText = {
  add: "Personal",
  addTitle: "Add to my calendar",
  editTitle: "Your appointment",
  description: "Something personal: an appointment, class, shift or day off.",
  what: "What",
  whatPlaceholder: "Dentist",
  whatRequired: "Say what it is.",
  date: "Date",
  from: "From",
  to: "To",
  allDay: "All day",
  timesWrong: "The end has to be after the start.",
  notes: "Notes",
  notesPlaceholder: "Anything to remember",
  whoSees: "Who sees it",
  whoSeesBody: (title: string) =>
    `You and managers see ${title ? `"${title}"` : "what it is"}. Everyone else sees Busy on those hours.`,
  busyNote:
    "It counts as busy when someone plans an event with you, so you won't get booked over it.",
  cancel: "Cancel",
  save: "Save",
  addButton: "Add",
  delete: "Delete",
  added: (title: string) => `${title} added to your calendar`,
  saved: (title: string) => `${title} saved`,
  deleted: (title: string) => `${title} deleted`,
  busy: "Busy",
  private: "Only you and managers see what it is",
} as const;

export const CheckText = {
  canMake: (free: number, total: number) => `${free} of ${total} can make it`,
  everyoneFree: (total: number) =>
    total === 1 ? "They're free" : `All ${total} are free`,
  busy: (name: string, title: string | undefined, time: string) =>
    title ? `${name} is busy ${time} (${title})` : `${name} is busy ${time}`,
  unavailable: (name: string) => `${name} is usually unavailable then`,
  freeTimes: "Everyone's free",
  freeTimesNote: "Same length, the next few days",
  noFreeTimes: "No time this week when everyone's free.",
  pickTime: (label: string) => `Move the event to ${label}`,
  checking: "Checking who's free…",
  everyoneNote: "Everyone is in it, so there's no check of who's free.",
} as const;

export const TeamText = {
  title: "Team availability",
  mine: "Mine",
  team: "Team",
  group: "Work group",
  everyone: "Everyone",
  range: "8 AM to midnight",
  events: (group: string) => `${group} events`,
  eventsNote: "What's planned",
  everyoneFree: "Everyone free",
  allAvailable: (count: number) => `All ${count} available`,
  clashes: (count: number) => (count === 1 ? "1 clash" : `${count} clashes`),
  clash: (event: string, reason: string) => `${event} clashes with ${reason}`,
  bestTimes: (group: string) => `When all of ${group} is free`,
  bestNote: "Pick one to plan an event at that time.",
  noBest: "No two-hour stretch this week when everyone is free.",
  legend: {
    available: "Available",
    unavailable: "Unavailable (usual week or exception)",
    busy: "Personal appointment",
    clash: "Clashes with an event",
  },
  noMembers: "Nobody in this group yet.",
  unavailableLabel: "unavailable",
} as const;

export const MyAvailabilityText = {
  title: "My availability",
  intro:
    "Your usual week. Your personal appointments count as busy on their own, so you don't need to mark them here.",
  save: "Save",
  saved: "Availability saved",
  whoSees: "Who sees it",
  whoSeesBody:
    "Everyone can see when you're free or not, so events land when you can make them. Only you and managers see what your personal appointments are.",
  loading: "Loading your availability",
  discard: {
    title: "Leave without saving?",
    body: "Your changes to your availability won't be kept.",
    keep: "Keep editing",
    confirm: "Leave",
  },
} as const;

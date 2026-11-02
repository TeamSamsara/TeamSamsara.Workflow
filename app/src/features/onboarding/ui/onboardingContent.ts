// File : /TeamSamsara.Workflow/app/src/features/onboarding/ui/onboardingContent.ts
// Version : 1.1.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : The words of the walkthrough: chapter names, each step's note, the
// welcome, the "make it yours" step, the calendar card and the invite preview.

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;

export const ChapterText = {
  titles: {
    gettingAround: "Getting around",
    myTasks: "My tasks",
    yourTime: "Your time",
    planning: "Planning events",
    several: "Several events",
    teamAvailability: "Team availability",
    workflows: "Workflows",
    approving: "Approving tasks",
    settings: "Settings",
    yours: "Make it yours",
  },
  steps: {
    nav: {
      title: "The menu",
      body: "Calendar, My tasks and Documentation are always here. Availability sits under Calendar. Your name at the bottom opens Your account.",
    },
    picker: {
      title: "Whose calendar",
      body: "My calendar shows what involves you: events you're in, yourself or with your work groups, and anything for everyone. Pick a work group here to see theirs.",
    },
    views: {
      title: "Month, week or list",
      body: "Week runs from 8 AM to midnight, so evening matches fit. Times show in your own time zone.",
    },
    events: {
      title: "Open an event",
      body: "Click any event to see who's in it, its details and how far its tasks are. Events you're in yourself are outlined.",
    },
    tasks: {
      title: "Your tasks",
      body: "What's given to you or your work groups, soonest first. Tick a task once it's done.",
    },
    review: {
      title: "Reviews and live links",
      body: "Some tasks need a check before they're done: send them for review and they come back approved or with changes. Some ask for a live link when you finish.",
    },
    paint: {
      title: "Paint your usual week",
      body: "Click or drag over the hours you're usually not free, like school or work, then Save. Managers see who can make an event from this.",
    },
    exceptions: {
      title: "Exceptions",
      body: "Away for a tournament, an exam or a trip? Add the dates here and they override your usual week.",
    },
    personal: {
      title: "Personal appointments",
      body: "Add a dentist visit or a class to your calendar. Only you and managers see what it is; everyone else sees Busy.",
    },
    newEvent: {
      title: "Plan an event",
      body: "New event plans one event (or one that repeats), several at once, or a personal appointment.",
    },
    people: {
      title: "Who's in it",
      body: "Add people or work groups. It shows on their calendars and only they see it. Once they're in, you see who can make it and nearby times when everyone's free.",
    },
    workflows: {
      title: "Workflows make the tasks",
      body: "Tick a workflow and its tasks are made with the event, each given to the right group and due at the right time.",
    },
    repeat: {
      title: "Repeats",
      body: "Weekly scrims or a Monday meeting: make it repeat and the coming weeks are planned for you.",
    },
    shared: {
      title: "Several at once",
      body: "For a split or a month of content: set what the events share once. Words in {curly brackets} in the title become a column, filled in per event.",
    },
    rows: {
      title: "One row per event",
      body: "Add dates on a pattern, paste them from a spreadsheet, or add rows one by one. Anything not known yet can stay TBD.",
    },
    sets: {
      title: "Sets",
      body: "Events planned together are kept as a set: see how far it is, and move or delete several at once.",
    },
    team: {
      title: "A group's week",
      body: "Everyone in a work group, their usual hours, appointments and the group's events. Anyone booked when they're not free is outlined in red.",
    },
    best: {
      title: "When everyone's free",
      body: "Pick one of these to plan an event at that time, with the group already in it.",
    },
    whatIs: {
      title: "What a workflow is",
      body: "A reusable list of tasks for a kind of event: what happens before, during and after, who does it and when it's due.",
    },
    make: {
      title: "Make one",
      body: "A short guide asks a question at a time and builds it for you. Fields like {opponent} are filled in from each event.",
    },
    approvals: {
      title: "Reviews wait here",
      body: "Tasks sent for review show here. Open one to approve it or ask for changes.",
    },
    settings: {
      title: "Settings",
      body: "Members, roles, work groups and the workspace. Each part shows only to people who look after it.",
    },
    invite: {
      title: "Invite people",
      body: "Pick their roles and work groups when you invite them. Their walkthrough follows from those.",
    },
  },
} as const;

export const WalkthroughText = {
  stepOf: (step: number, total: number) => `${step} of ${total}`,
  next: "Next",
  back: "Back",
  done: "Done",
  skipChapter: "Skip chapter",
  close: "Close the walkthrough",
  tryIt: "Try it: nothing is saved until you press Save",
  lost: "This part isn't on the page right now. Carry on with Next.",
  paused:
    "Walkthrough paused. Pick it back up from the card on your calendar or from Documentation.",
} as const;

export const WelcomeText = {
  title: (name: string) => `Welcome to Workflow, ${name}`,
  body: "Team Samsara's planning tool: what's coming up, what you need to do, and when people are free.",
  intro: (minutes: number) =>
    `A walkthrough shows you around the real pages, one part at a time. It takes about ${minutes} minutes, for what you can do:`,
  start: "Show me around",
  later: "Later",
  laterNote: "You can start it anytime from your calendar or Documentation.",
} as const;

export const MakeItYoursText = {
  title: "Make it yours",
  step: "Last step of the walkthrough",
  later: "Change any of it later on Your account.",
  name: "Name",
  gameName: "In-game name",
  optional: "Optional",
  preview: "How others see you",
  timeZone: "Your time zone",
  sameAsWorkspace: (example: string) => `Same as the workspace (${example})`,
  device: (city: string) => `We found ${city} on this device.`,
  offerDevice: (city: string) => `Use ${city}`,
  dates: "Dates",
  clock: "Clock",
  clocks: { "12h": "7:00 PM", "24h": "19:00" },
  note: (city: string) =>
    `Times show in your time zone. Things are still planned in ${city} time; an event's page shows both.`,
  skip: "Later",
  save: "Save",
  saveAndPaint: "Save and paint my usual week",
  nameRequired: "Enter your name.",
  failed: "Couldn't save",
} as const;

export const CardText = {
  title: "Your walkthrough",
  newForYou: "New for you",
  progress: (done: number, total: number, minutes: number) =>
    `${done} of ${plural(total, "chapter")} · about ${plural(minutes, "minute")} left`,
  continueWith: (chapter: string) => `Continue: ${chapter}`,
  hide: "Hide the walkthrough card",
} as const;

export const PreviewText = {
  title: "The onboarding they'll get",
  summary: (chapters: number, minutes: number) =>
    `${plural(chapters, "chapter")} · about ${plural(minutes, "minute")}`,
  note: "Greyed chapters are for permissions these roles don't give. Change the roles and the list follows.",
} as const;

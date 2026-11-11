// File : /TeamSamsara.Workflow/app/src/features/availability/ui/teamViewContent.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The words of Team availability: the switches, the people list,
// the hour grid, the People rows and the side panel for the picked hour.

export const TeamViewText = {
  seeBy: "See it by",
  views: { hours: "Hours", people: "People" },
  showTimesIn: "Show times in",
  zones: {
    team: (city: string) => `${city} (team)`,
    mine: (city: string) => `Mine (${city})`,
  },
  zoneLine: {
    team: (city: string) => `${city} time, the team's`,
    mine: (city: string, apart: string) => `${city} time, yours${apart}`,
  },
  apart: (hours: number, teamCity: string) => {
    if (hours === 0) return "";
    const size = Math.abs(hours);
    const amount = Number.isInteger(size) ? `${size} h` : `${size} h`;
    return ` (${amount} ${hours < 0 ? "behind" : "ahead of"} ${teamCity})`;
  },
  people: "People",
  peopleHelp: "Click a name to show or hide them",
  comparing: (shown: number, total: number) => `Comparing ${shown} of ${total}`,
  untagged: "No tag",
  everyone: "Everyone",
  sectionToggle: (section: string, on: boolean) =>
    on ? `Hide ${section}` : `Show ${section}`,
  personToggle: (name: string, on: boolean) =>
    on ? `Hide ${name}` : `Show ${name}`,
  reorder: (name: string) => `Move ${name}`,
  editTags: "Edit tags",
  doneTags: "Done",
  states: {
    free: "Free",
    busy: "Busy",
    unknown: "Not filled in",
    hidden: "Hidden",
  },
  hoursGrid: "Who's free each hour",
  cell: (day: string, time: string, free: number, total: number) =>
    total === 0
      ? `${day} ${time}: nobody to compare`
      : `${day} ${time}: ${free} of ${total} free`,
  unavailable: "Unavailable",
  more: (count: number) => `+${count}`,
  notFilled: "?",
  notFilledLabel: "Not filled in",
  dayFree: (name: string, day: string, text: string) =>
    `${name}, ${day}: ${text}`,
  picked: (day: string, time: string) => `${day} · ${time}`,
  pickedSub: (zone: string, from: string, to: string) =>
    `${zone} · ${from} to ${to}`,
  pickedSubPeople: "Click a day to change it",
  zoneShort: { team: "Team time", mine: "Your time" },
  free: (count: number) => `Free · ${count}`,
  busy: (count: number) => `Busy or unavailable · ${count}`,
  unknown: (count: number) => `Not filled in · ${count}`,
  nobody: "Nobody",
  everyoneFilled: "Everyone has",
  planThen: "Plan an event then",
  bestTitle: "When everyone shown is free",
  bestNote:
    "Only counts the people ticked on the left, so someone away doesn't hide these.",
  noBest: "No two hours this week when everyone shown is free.",
  noneShown: "Tick some people to compare them.",
  peopleNote:
    "One row per person, in your order. Times follow the switch at the top. Drag names to reorder; it's just for you.",
} as const;

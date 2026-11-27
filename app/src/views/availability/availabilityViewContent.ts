// File : /TeamSamsara.Workflow/app/src/views/availability/availabilityViewContent.ts
// Version : 1.2.0
// Latest commit: feature/1.2-calendars-lists
// Author : Gerrah
// Purpose : The words on the availability pages.

export const AvailabilityViewText = {
  calendar: "Calendar",
  mine: "My availability",
  team: "Team availability",
  previousWeek: "Previous week",
  nextWeek: "Next week",
  thisWeek: "This week",
  group: "Work group",
  noGroups: "There are no work groups yet. Make one in Settings → Work groups.",
} as const;

export const TeamGroupsText = {
  title: "Team availability",
  description: (zone: string) =>
    `Who's free when, one group at a time. Times in ${zone}.`,
  mine: "My availability",
  yourGroups: "Your groups",
  otherGroups: "Other groups",
  allGroups: "Groups",
  yours: "Your group",
  ledBy: (name: string) => `Led by ${name}`,
  people: (count: number) => (count === 1 ? "1 person" : `${count} people`),
  seeWeek: "See the week",
  none: "No work groups yet. Make them in Settings → Work groups.",
  loading: "Loading groups",
} as const;

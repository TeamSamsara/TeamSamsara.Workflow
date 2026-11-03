// File : /TeamSamsara.Workflow/app/src/features/events/ui/audienceContent.ts
// Version : 1.0.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : The words for who's in an event.

export const AudiencePickerText = {
  label: "Who's in it",
  placeholder: "Search people, groups or Everyone…",
  everyone: "Everyone",
  everyoneHint: "The whole workspace",
  group: "Work group",
  person: "Person",
  people: (count: number) => (count === 1 ? "1 person" : `${count} people`),
  someone: "Someone who left",
  oldGroup: "A deleted group",
  remove: (name: string) => `Remove ${name}`,
  nobodyNote: "Nobody yet: only you and people with View all will see it.",
  someNote:
    "It shows on their calendars. Only they, you and people with View all can see it.",
  everyoneNote: "Everyone in the workspace sees it.",
} as const;

export const AudienceText = {
  everyone: "Everyone",
  nobody: "Only who made it",
} as const;

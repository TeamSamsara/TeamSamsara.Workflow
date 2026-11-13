// File : /TeamSamsara.Workflow/app/src/views/settings/activity/activityViewContent.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : The words of Settings › Activity.

export const ActivityViewText = {
  title: "Activity",
  description:
    "Who changed people, roles, groups and settings, and when. Kept for a year; nobody can edit or delete it.",
  loading: "Loading activity",
  none: "Nothing yet. Changes show here from now on.",
  failed: "The activity couldn't load.",
  show: "Show",
  areas: {
    all: "All",
    people: "People",
    roles: "Roles",
    groups: "Groups",
    settings: "Settings",
    tasks: "Tasks",
  },
  by: (name: string) => `by ${name}`,
  system: "by Playbook",
  someone: "someone",
} as const;

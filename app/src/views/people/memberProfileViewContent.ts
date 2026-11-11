// File : /TeamSamsara.Workflow/app/src/views/people/memberProfileViewContent.ts
// Version : 1.0.1
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The words on a member's profile.

export const MemberProfileText = {
  loading: "Loading their profile",
  notFound: "This person isn't in the workspace.",
  groups: "Groups",
  tags: "Tags",
  workGroups: "Work groups",
  noGroups: "No work groups",
  forThem: "for them",
  sameTime: (city: string) => `${city} · same time as you`,
  apart: (city: string, hours: number) => {
    const size = Math.abs(hours);
    const amount = size === 1 ? "1 hour" : `${size} hours`;
    return `${city} · ${amount} ${hours < 0 ? "behind" : "ahead of"} you`;
  },
  usualWeek: "Usual week",
  zoneLabel: "Show times in",
  theirTime: "Their time",
  myTime: "My time",
  busyNote: (list: string) => `Busy this week: ${list}.`,
  comingUp: "Coming up",
  nothingComingUp: "Nothing coming up that you can see.",
  replies: {
    going: "Going",
    maybe: "Maybe",
    cant: "Can't go",
    waiting: "Hasn't replied",
    none: "No reply asked",
  },
  theirTasks: "Their tasks",
  noTasks: "No open tasks you can see.",
  noDue: "No due date",
} as const;

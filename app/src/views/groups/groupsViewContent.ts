// File : /TeamSamsara.Workflow/app/src/views/groups/groupsViewContent.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The words on the Groups list and a group's overview.

export const GroupsViewText = {
  title: "Groups",
  intro: (workspace: string) => `The teams in ${workspace}. Yours are first.`,
  newGroup: "New group",
  loading: "Loading groups",
  none: "No work groups yet.",
  noneHelp:
    "People with Manage work groups make them in Settings › Work groups.",
  youLead: "You lead it",
  youreIn: "You're in it",
  members: (count: number) => (count === 1 ? "1 member" : `${count} members`),
  lead: "Lead",
  noLead: "No lead yet",
  nextUp: "Next up",
  openTasks: "Open tasks",
  nothingPlanned: "Nothing planned",
  hidden: "—",
  more: (count: number) => `+${count}`,
} as const;

export const GroupViewText = {
  groups: "Groups",
  loading: "Loading the group",
  notFound: "This group doesn't exist any more.",
  back: "All groups",
  tabsLabel: "Group pages",
  tabs: {
    overview: "Overview",
    tasks: "Tasks",
    calendar: "Calendar",
    availability: "Availability",
  },
  addMembers: "Add members",
  planEvent: "Plan an event",
  leads: (names: string[]) =>
    names.length === 0
      ? "No leads yet"
      : names.length === 1
        ? `Lead ${names[0]}`
        : `Leads ${names.slice(0, -1).join(", ")} and ${names.at(-1)}`,
  members: (count: number) => (count === 1 ? "1 member" : `${count} members`),
  membersTitle: (count: number) => `Members (${count})`,
  filterLabel: "Show members by tag",
  all: "All",
  addMember: "Add member",
  lead: "Lead",
  noMembers: "Nobody in this group yet.",
  openTasks: "Open tasks",
  seeAll: "See all",
  task: "Task",
  givenTo: "Given to",
  due: "Due",
  nobodyYet: "Nobody yet",
  noTasks: "No open tasks. Nice.",
  cantSeeTasks: "You see this group's tasks once you're in it.",
  noDue: "No due date",
  about: "About",
  noAbout: "No description yet.",
  resources: "Key resources",
  noResources: "No links yet.",
  upNext: "Up next",
  nothingPlanned: "Nothing planned in the next four weeks.",
  cantSeeEvents: "You see this group's events once you're in it.",
  tasksDone: (done: number, total: number) => `${done} of ${total} tasks done`,
} as const;

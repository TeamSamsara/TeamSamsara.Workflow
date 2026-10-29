// File : /TeamSamsara.Workflow/app/src/views/settings/groups/workGroupsViewContent.ts
// Version : 1.0.0
// Latest commit: feature/work-groups
// Author : Gerrah
// Purpose : The words on the Work groups settings page.

export const WorkGroupsViewText = {
  title: "Work groups",
  description:
    "Teams that tasks can be given to. A task can go to a group, a person, or both.",
  newGroup: "New group",
  loading: "Loading work groups",
  emptyTitle: "No work groups yet",
  emptyBody:
    "Make a group for each team, like Design or Video, so tasks can go to the whole team.",
  reset: "Reset",
  save: "Save changes",
  saved: (name: string) => `${name} saved`,
  deleteGroup: "Delete group",
  membersHeading: "Members",
  membersNote:
    "People join groups from their member page. Work groups say who does the work; roles say what people may do.",
  noMembers: "Nobody is in this group yet.",
  discard: {
    title: "Discard your changes?",
    body: "This group has changes you haven't saved. Leaving now throws them away.",
    keep: "Keep editing",
    confirm: "Discard changes",
  },
} as const;

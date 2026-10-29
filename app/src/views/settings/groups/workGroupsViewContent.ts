// File : /TeamSamsara.Workflow/app/src/views/settings/groups/workGroupsViewContent.ts
// Version : 1.1.0
// Latest commit: feature/members
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
    "Work groups say who does the work. Roles say what people are allowed to do. Someone can be in any number of groups.",
  addMembers: "Add members",
  pickerTitle: (group: string) => `Add to ${group}`,
  remove: "Remove",
  removeLabel: (name: string, group: string) => `Take ${name} out of ${group}`,
  added: (count: number, group: string) =>
    count === 1
      ? `1 member added to ${group}`
      : `${count} members added to ${group}`,
  removed: (name: string, group: string) => `${name} taken out of ${group}`,
  failed: "That didn't work",
  noMembers: "Nobody is in this group yet.",
  discard: {
    title: "Discard your changes?",
    body: "This group has changes you haven't saved. Leaving now throws them away.",
    keep: "Keep editing",
    confirm: "Discard changes",
  },
} as const;

// File : /TeamSamsara.Workflow/app/src/features/work-groups/ui/workGroupsContent.ts
// Version : 1.1.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : The words on the work group cards, form, picker and dialogs.

export const WorkGroupCardText = {
  ledBy: (names: string) => `Led by ${names}`,
  memberCount: (count: number) =>
    `${count} ${count === 1 ? "member" : "members"}`,
  moreMembers: (count: number) => `+${count}`,
  noDescription: "No description yet.",
  gridLabel: "Work groups",
} as const;

export const WorkGroupFormText = {
  name: "Group name",
  description: "What this group does",
  descriptionHint: "A sentence, so people know when to give it a task.",
} as const;

export const WorkGroupPickerText = {
  legend: "Work groups",
  hint: "Someone can be in any number of groups.",
  none: "There are no work groups yet.",
} as const;

export const NewWorkGroupDialogText = {
  title: "New work group",
  description:
    "A team tasks can be given to. Add people to it from their member page.",
  namePlaceholder: "Video",
  cancel: "Cancel",
  create: "Create group",
  created: (name: string) => `${name} created`,
} as const;

export const DeleteWorkGroupDialogText = {
  title: (name: string) => `Delete ${name}?`,
  body: (count: number | null) => {
    const who =
      count === null
        ? "Its members leave the group"
        : count === 1
          ? "Its 1 member leaves the group"
          : `Its ${count} members leave the group`;
    return `${who}, but stay in the workspace. Tasks given to the group stay with the people working on them.`;
  },
  cannotUndo: "This can't be undone.",
  cancel: "Cancel",
  confirm: "Delete group",
  deleted: (name: string) => `${name} deleted`,
} as const;

export const GroupRulesText = {
  urlRequired: "Paste the link's address.",
  urlInvalid: "Use a full web address starting with https://",
  labelRequired: "Give the link a name, like Shared drive.",
} as const;

export const WorkGroupLeadsText = {
  title: "Group leads",
  hint: "Leads approve and hand out the group's tasks. Only people who can approve or reassign tasks can lead.",
  none: "No lead yet.",
  add: "Add lead",
  remove: (name: string) => `Remove ${name} as a lead`,
  pickerTitle: (group: string) => `Leads for ${group}`,
  noneEligible:
    "Nobody can lead yet. Give someone a role with Approve tasks or Reassign tasks first.",
} as const;

export const WorkGroupLinksText = {
  title: "Links",
  hint: "Where the group works from: a shared drive, a brand folder, a board.",
  none: "No links yet.",
  add: "Add link",
  label: "Name",
  labelPlaceholder: "Shared drive",
  url: "Address",
  urlPlaceholder: "https://",
  remove: (label: string) => `Remove ${label || "this link"}`,
  open: (label: string) => `Open ${label}`,
} as const;

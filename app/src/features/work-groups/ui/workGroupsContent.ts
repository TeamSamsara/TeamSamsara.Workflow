// File : /TeamSamsara.Workflow/app/src/features/work-groups/ui/workGroupsContent.ts
// Version : 1.1.0
// Latest commit: fix/group-leads-and-x-premium
// Author : Gerrah
// Purpose : The words on the work group cards, form, picker and dialogs.

export const WorkGroupCardText = {
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

export const WorkGroupLeadsText = {
  heading: "Leads",
  note: "Leads approve and hand out the group's tasks. Only people who can approve or reassign tasks can lead a group.",
  add: "Add lead",
  remove: (name: string) => `Remove ${name} as lead`,
  none: "No leads yet.",
  notEligible: "Can't approve or reassign tasks any more",
  max: (count: number) => `A group can have up to ${count} leads.`,
} as const;

export const WorkGroupLinksText = {
  heading: "Links",
  note: "Shared drives, brand assets, briefs: anything the group keeps coming back to.",
  label: "Name",
  labelPlaceholder: "Shared drive",
  url: "Web address",
  urlPlaceholder: "https://",
  add: "Add link",
  remove: (label: string) => `Remove the ${label || "new"} link`,
  open: (label: string) => `Open ${label}`,
  none: "No links yet.",
  max: (count: number) => `A group can have up to ${count} links.`,
} as const;

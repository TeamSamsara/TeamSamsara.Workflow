// File : /TeamSamsara.Workflow/app/src/features/work-groups/ui/workGroupsContent.ts
// Version : 1.0.0
// Latest commit: feature/work-groups
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

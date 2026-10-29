// File : /TeamSamsara.Workflow/app/src/features/roles/ui/roleListContent.ts
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : The words in the role list and the role picker.

export const RoleListText = {
  title: "Roles",
  label: "Roles, highest first",
  newRole: "New role",
  everyoneCount: "all",
  memberCount: (count: number) =>
    `${count} ${count === 1 ? "member" : "members"}`,
  move: (name: string) =>
    `Move ${name}. Use the up and down arrow keys, or drag the row.`,
  locked: (name: string) => `${name} is at or above your own role`,
  hint: "Drag to reorder. Higher roles can manage the ones below them.",
  saving: "Saving the new order…",
} as const;

export const RolePickerText = {
  legend: "Roles",
  hint: "Everyone gets the Everyone role too. You can change roles any time.",
  none: "There are no roles you can give yet.",
} as const;

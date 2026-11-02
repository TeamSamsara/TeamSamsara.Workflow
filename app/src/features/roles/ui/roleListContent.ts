// File : /TeamSamsara.Workflow/app/src/features/roles/ui/roleListContent.ts
// Version : 1.1.0
// Latest commit: fix/invite-and-fields
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
  everything: "Can do everything.",
  nothingExtra: "Nothing beyond what Everyone can do.",
  /** "Plan events and repeats, see everyone's availability and 1 more." */
  gives: (labels: readonly string[]) => {
    const [first = "", ...rest] = labels;
    const words = [
      first,
      ...rest.map((label) => label.charAt(0).toLowerCase() + label.slice(1)),
    ];
    return words.length > 2
      ? `${words.slice(0, 2).join(", ")} and ${words.length - 2} more.`
      : `${words.join(" and ")}.`;
  },
} as const;

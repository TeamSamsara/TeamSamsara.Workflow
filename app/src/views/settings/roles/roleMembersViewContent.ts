// File : /TeamSamsara.Workflow/app/src/views/settings/roles/roleMembersViewContent.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : The words on a role's Members tab.

export const RoleMembersViewText = {
  search: "Search members",
  add: "Add members",
  pickerTitle: (role: string) => `Give ${role} to…`,
  caption: (role: string) => `Members with ${role}`,
  member: "Member",
  allRoles: "All roles",
  remove: "Remove",
  removeLabel: (name: string) => `Take the role away from ${name}`,
  none: "Nobody has this role yet.",
  noMatch: "Nobody matches.",
  loading: "Loading members",
  locked:
    "You can't give or take away this role: it's at or above your own, or it has permissions you don't have.",
  given: (count: number, role: string) =>
    count === 1
      ? `${role} given to 1 member`
      : `${role} given to ${count} members`,
  taken: (name: string, role: string) => `${role} taken away from ${name}`,
  failed: "That didn't work",
} as const;

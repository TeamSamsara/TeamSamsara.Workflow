// File : /TeamSamsara.Workflow/app/src/features/roles/ui/permissionListContent.ts
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : The words around the permission switches on a role's Permissions tab.

export const PermissionListText = {
  search: "Search permissions",
  clearAll: "Clear all",
  noResults: (search: string) => `No permission matches “${search}”.`,
  everyoneBanner:
    "Every member has this role and it can't be removed. Switch on only what all members should have. Administrator can't be given to Everyone.",
  notYours: "You can only switch on or off permissions you have yourself.",
  readOnly:
    "This role is at or above your own highest role, so you can't change it.",
} as const;

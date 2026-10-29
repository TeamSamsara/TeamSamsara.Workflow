// File : /TeamSamsara.Workflow/app/src/views/settings/roles/rolesViewContent.ts
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : The words on the Roles settings page and its tabs.

export const RolesViewText = {
  title: "Roles",
  description:
    "Roles decide what people can do. A member can have several roles and gets every permission they switch on, like Discord.",
  loading: "Loading roles",
  editTitle: (name: string) => `Edit role: ${name}`,
  tabsLabel: "Role sections",
  tabs: { display: "Display", permissions: "Permissions" },
  reset: "Reset",
  save: "Save changes",
  saved: (name: string) => `${name} saved`,
  orderFailed: "The new order couldn't be saved.",
  discard: {
    title: "Discard your changes?",
    body: "This role has changes you haven't saved. Leaving now throws them away.",
    keep: "Keep editing",
    confirm: "Discard changes",
  },
} as const;

// File : /TeamSamsara.Workflow/app/src/views/settings/members/memberViewContent.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : The words on a member's page.

export const MemberViewText = {
  back: "Members",
  loading: "Loading member",
  reset: "Reset",
  save: "Save changes",
  saved: (name: string) => `${name} saved`,
  lockedAdmin:
    "This member is an Administrator. Only an Administrator can change their roles, groups or access.",
  discard: {
    title: "Discard your changes?",
    body: "This member has changes you haven't saved. Leaving now throws them away.",
    keep: "Keep editing",
    confirm: "Discard changes",
  },
} as const;

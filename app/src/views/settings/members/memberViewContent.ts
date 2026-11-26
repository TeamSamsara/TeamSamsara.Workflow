// File : /TeamSamsara.Workflow/app/src/views/settings/members/memberViewContent.ts
// Version : 1.1.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The words on a member's page.

export const MemberViewText = {
  back: "Members",
  loading: "Loading member",
  reset: "Reset",
  save: "Save changes",
  saved: (name: string) => `${name} saved`,
  lockedRank:
    "You can change only people whose highest role is below yours. Someone above you changes this member.",
  lockedSelf:
    "You can't change your own roles, groups or access. Someone above you can.",
  owner: {
    title: "Owner",
    isOwner: (name: string) => `${name} is an Owner: above every role.`,
    give: (name: string) => `Make ${name} an Owner`,
    giveHelp:
      "Owners sit above every role and can do everything. Only an Owner can step down; nobody can take it from them.",
    stepDown: "Step down as Owner",
    stepDownHelp: "You'll keep your other roles. Another Owner stays.",
    lastOwner:
      "You're the only Owner. Make someone else an Owner before stepping down.",
    given: (name: string) => `${name} is now an Owner`,
    steppedDown: "You're no longer an Owner",
  },
  discard: {
    title: "Discard your changes?",
    body: "This member has changes you haven't saved. Leaving now throws them away.",
    keep: "Keep editing",
    confirm: "Discard changes",
  },
} as const;

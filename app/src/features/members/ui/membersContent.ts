// File : /TeamSamsara.Workflow/app/src/features/members/ui/membersContent.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : The words in the members feature: the table, status pills, the
// email field, the invite dialog, a member's cards, the member picker, and the
// access actions.

import type { MemberStatus } from "@/core/data";
import type { InviteOutcome } from "../types/memberTypes";

export const MemberStatusText: Record<MemberStatus, string> = {
  active: "Active",
  invited: "Invited",
  disabled: "Disabled",
  removed: "Removed",
};

export const MembersTableText = {
  caption: "Members",
  member: "Member",
  roles: "Roles",
  groups: "Work groups",
  status: "Status",
  lastActive: "Last active",
  open: (name: string) => `Open ${name}`,
  openColumn: "Open",
  everyoneOnly: "Everyone only",
  noGroups: "—",
  invitedOn: (date: string) => `Sent ${date}`,
  none: "Nobody matches.",
} as const;

export const EmailListInputText = {
  label: "Emails",
  placeholder: "Add an email",
  morePlaceholder: "Add another email",
  hint: "Paste several at once, separated by commas or new lines.",
  remove: (email: string) => `Remove ${email}`,
  rejected: (parts: string[]) =>
    `${parts.length === 1 ? "This isn't an email" : "These aren't emails"}: ${parts.join(", ")}`,
} as const;

export const InviteDialogText = {
  title: "Invite people",
  description:
    "They get an email with a link to set a password. Then they sign in with email and password.",
  linkNote:
    "Invite links work for 1 hour. If one runs out, use Resend invite on the member's page.",
  needEmail: "Add at least one email.",
  cancel: "Cancel",
  close: "Close",
  send: (count: number) =>
    count === 1 ? "Send 1 invite" : `Send ${count} invites`,
  sending: (done: number, total: number) => `Sending ${done} of ${total}…`,
  resultsTitle: "How it went",
  outcome: {
    invited: "Invite sent",
    reinvited: "Welcomed back, invite sent",
    alreadyMember: "Already a member",
    accountExists:
      "Has a sign-in account but no member record. Remove the account in the Firebase console, then invite again.",
    failed: "Couldn't be invited. Try again.",
  } satisfies Record<InviteOutcome, string>,
} as const;

export const MemberHeaderText = {
  joined: (date: string) => `joined ${date}`,
  invited: (date: string) => `invited ${date}`,
  noName: "No name yet",
  name: "Name",
  nameHint:
    "Shown instead of their email. They can change it themselves later.",
} as const;

export const MemberCardsText = {
  rolesTitle: "Roles",
  rolesNote: (name: string) =>
    `Roles add up: ${name} can do everything any of these roles allows. You can only give roles below your own highest role.`,
  lockedRoles: "Roles you can't change",
  groupsTitle: "Work groups",
  groupsNote: "Tasks given to a work group show up in every member's My tasks.",
  permissionsTitle: (name: string) => `What ${name} can do`,
  permissionsNote: (name: string) =>
    `Worked out from all of ${name}'s roles. Change it by changing roles.`,
  can: "Can",
  cannot: "Can't",
} as const;

export const MemberAccessText = {
  title: "Access",
  resendTitle: "Resend invite",
  resendBody:
    "Sends the set-password email again. Only for people who haven't signed in yet.",
  resend: "Resend invite",
  offTitle: "Turn off access",
  offBody: (name: string) =>
    `${name} can't sign in. Their tasks and history stay. You can turn it back on.`,
  off: "Turn off access",
  onTitle: "Turn access back on",
  onBody: (name: string) => `${name} can sign in again with their password.`,
  on: "Turn on access",
  removeTitle: "Remove from workspace",
  removeBody:
    "Removes the member and takes away their roles and groups. Their name stays on past work. Inviting the same email again brings them back.",
  remove: "Remove",
  self: "This is you. Ask another admin to change your access.",
  confirmOff: (name: string) => `Turn off access for ${name}?`,
  confirmOffBody:
    "They're sent out on their next page and can't sign in until you turn access back on.",
  confirmRemove: (name: string) => `Remove ${name}?`,
  confirmRemoveBody:
    "They lose access, their roles and their work groups. You can invite them again later.",
  cancel: "Cancel",
} as const;

export const MemberActionText = {
  resent: (email: string) => `Invite sent again to ${email}`,
  turnedOff: (name: string) => `Access turned off for ${name}`,
  turnedOn: (name: string) => `Access turned back on for ${name}`,
  removed: (name: string) => `${name} removed`,
  failed: "That didn't work",
} as const;

export const MemberPickerText = {
  search: "Search by name or email",
  none: "Nobody left to add.",
  noMatch: "Nobody matches.",
  cancel: "Cancel",
  add: (count: number) =>
    count === 1 ? "Add 1 member" : `Add ${count} members`,
} as const;

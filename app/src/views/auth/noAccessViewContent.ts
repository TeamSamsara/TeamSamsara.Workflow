// File : /TeamSamsara.Workflow/app/src/views/auth/noAccessViewContent.ts
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : The text of the no-access page, for each reason.

import type { NoAccessReason } from "@/core/session";

export const NoAccessViewText = {
  title: "You don't have access",
  signedInAs: (email: string) =>
    `You're signed in as ${email}, but this account isn't an active member of this workspace.`,
  reasons: {
    disabled: "An admin turned off your access.",
    noRecord:
      "This account was never invited, or it was removed from the workspace.",
  } satisfies Record<NoAccessReason, string>,
  contactAdmin: "If you think this is a mistake, contact an admin.",
  signOut: "Sign out",
} as const;

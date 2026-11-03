// File : /TeamSamsara.Workflow/app/src/app/layouts/AuthLayout/authLayoutContent.ts
// Version : 1.1.0
// Latest commit: fix/sign-in-welcome
// Author : Gerrah
// Purpose : The text of the sign-in brand panel: a welcome for the team's own
// members, not a pitch.

export const AuthLayoutText = {
  /** Each line of the slogan, shown one under the other. */
  sloganLines: ["Welcome", "to your", "playbook"],
  tagline:
    "Sign in to see your events and tasks. New here? Use the link in your invite email.",
} as const;

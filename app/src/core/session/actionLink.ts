// File : /TeamSamsara.Workflow/app/src/core/session/actionLink.ts
// Version : 1.1.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : Reads the link in a Firebase email. Firebase adds `mode` (what the
// link is for), `oobCode` (the one-time code) and `continueUrl` (where to go
// after). Invites put a marker in continueUrl, so the page can greet invited
// people instead of talking about a reset.

/** Invites and password resets both arrive as resetPassword links. */
export const ActionLinkModes = ["resetPassword"] as const;
export type ActionLinkMode = (typeof ActionLinkModes)[number];

/** Why the password link was sent. Only changes the wording on the page. */
export type PasswordLinkPurpose = "invite" | "reset";

export interface ActionLink {
  mode: ActionLinkMode;
  code: string;
  purpose: PasswordLinkPurpose;
}

const modeParameter = "mode";
const codeParameter = "oobCode";
const continueParameter = "continueUrl";

/** The query parameter an invite adds to its continue address. */
export const inviteMarkerParameter = "invite";

function purposeFrom(continueUrl: string | null): PasswordLinkPurpose {
  if (!continueUrl) return "reset";
  try {
    const marker = new URL(continueUrl).searchParams.get(inviteMarkerParameter);
    return marker === null ? "reset" : "invite";
  } catch {
    return "reset";
  }
}

/** The link's purpose and code, or null when it is not a link this app handles. */
export function readActionLink(search: string): ActionLink | null {
  const parameters = new URLSearchParams(search);
  const mode = ActionLinkModes.find(
    (known) => known === parameters.get(modeParameter),
  );
  const code = parameters.get(codeParameter);
  if (!mode || !code) return null;
  return {
    mode,
    code,
    purpose: purposeFrom(parameters.get(continueParameter)),
  };
}

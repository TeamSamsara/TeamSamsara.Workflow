// File : /TeamSamsara.Workflow/app/src/core/session/actionLink.ts
// Version : 1.0.0
// Latest commit: core/session
// Author : Gerrah
// Purpose : Reads the link in a Firebase email. Firebase adds `mode` (what the
// link is for) and `oobCode` (the one-time code) to the address it sends.

/** Invites and password resets both arrive as resetPassword links. */
export const ActionLinkModes = ["resetPassword"] as const;
export type ActionLinkMode = (typeof ActionLinkModes)[number];

export interface ActionLink {
  mode: ActionLinkMode;
  code: string;
}

const modeParameter = "mode";
const codeParameter = "oobCode";

/** The link's purpose and code, or null when it is not a link this app handles. */
export function readActionLink(search: string): ActionLink | null {
  const parameters = new URLSearchParams(search);
  const mode = ActionLinkModes.find(
    (known) => known === parameters.get(modeParameter),
  );
  const code = parameters.get(codeParameter);
  if (!mode || !code) return null;
  return { mode, code };
}

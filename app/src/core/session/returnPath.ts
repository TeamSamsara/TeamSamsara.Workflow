// File : /TeamSamsara.Workflow/app/src/core/session/returnPath.ts
// Version : 1.0.0
// Latest commit: core/session
// Author : Gerrah
// Purpose : Remembers the page someone tried to open before being sent to sign
// in, so they land back on it. Only addresses inside the app are accepted, so a
// crafted link can't send people to another site.

/** What the sign-in redirect carries in the router's location state. */
export interface SignInLocationState {
  from?: string;
}

export function returnPathState(
  pathname: string,
  search: string,
): SignInLocationState {
  return { from: `${pathname}${search}` };
}

/** The remembered page, or null when there is none or it points outside the app. */
export function readReturnPath(state: unknown): string | null {
  if (state === null || typeof state !== "object") return null;
  const from = (state as SignInLocationState).from;
  if (typeof from !== "string") return null;
  const isInsideApp = from.startsWith("/") && !from.startsWith("//");
  return isInsideApp ? from : null;
}

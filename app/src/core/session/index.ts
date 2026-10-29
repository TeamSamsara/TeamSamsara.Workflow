// File : /TeamSamsara.Workflow/app/src/core/session/index.ts
// Version : 1.1.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : What other layers may use from the session module.

export {
  checkPasswordLink,
  sendPasswordLink,
  setPasswordFromLink,
  signIn,
  signOut,
} from "./authService";
export { authErrorKind } from "./authErrors";
export type { AuthErrorKind } from "./authErrors";
export { readActionLink } from "./actionLink";
export type {
  ActionLink,
  ActionLinkMode,
  PasswordLinkPurpose,
} from "./actionLink";
export { RedirectIfSignedIn } from "./RedirectIfSignedIn";
export { RequireSignedIn } from "./RequireSignedIn";
export { readReturnPath } from "./returnPath";
export type { SignInLocationState } from "./returnPath";
export { AuthErrorText } from "./sessionContent";
export { SessionLoading } from "./SessionLoading";
export { SessionProvider } from "./SessionProvider";
export type { NoAccessReason, SessionState, SessionUser } from "./sessionTypes";
export { useSession } from "./useSession";

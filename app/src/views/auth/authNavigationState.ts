// File : /TeamSamsara.Workflow/app/src/views/auth/authNavigationState.ts
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : The email the sign-in pages hand each other when moving between them
// (sign in → forgot password → check your inbox), read back safely.

export interface EmailNavigationState {
  email?: string;
}

export function readNavigationEmail(state: unknown): string {
  if (state === null || typeof state !== "object") return "";
  const email = (state as EmailNavigationState).email;
  return typeof email === "string" ? email : "";
}

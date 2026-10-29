// File : /TeamSamsara.Workflow/app/src/shared/validation/textLimits.ts
// Version : 1.1.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : The longest a typed name or description may be. firestore.rules checks the same
// numbers, so keep the two in step.

export const TextLimits = {
  /** A workspace, member, role or group name. */
  name: 80,
  /** A short description under a role or group name. */
  description: 300,
} as const;

// File : /TeamSamsara.Workflow/app/src/shared/validation/textLimits.ts
// Version : 1.0.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : The longest a typed name may be. firestore.rules checks the same
// numbers, so keep the two in step.

export const TextLimits = {
  /** A workspace, member, role or group name. */
  name: 80,
} as const;

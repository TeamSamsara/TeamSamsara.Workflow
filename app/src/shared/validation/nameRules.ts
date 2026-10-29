// File : /TeamSamsara.Workflow/app/src/shared/validation/nameRules.ts
// Version : 1.0.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : The check every typed name goes through (workspace, member, role,
// group): not blank, and no longer than TextLimits.name once trimmed.

import { TextLimits } from "./textLimits";
import { ValidationText } from "./validationContent";

/** The error to show for this name, or undefined when it's fine. */
export function checkName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return ValidationText.nameRequired;
  if (trimmed.length > TextLimits.name) {
    return ValidationText.nameTooLong(TextLimits.name);
  }
  return undefined;
}

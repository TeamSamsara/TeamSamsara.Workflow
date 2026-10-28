// File : /TeamSamsara.Workflow/app/src/shared/components/Fields/FieldFrame/useFieldIds.ts
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : The ids that tie a field's input to its label, hint and error, so screen readers
// read all three. Uses the caller's id when there is one.

import { useId } from "react";

export interface FieldIds {
  inputId: string;
  hintId: string;
  errorId: string;
  /** The value for aria-describedby: the hint and error that are showing, or nothing. */
  describedBy: string | undefined;
}

export function useFieldIds(
  id: string | undefined,
  hasHint: boolean,
  hasError: boolean,
): FieldIds {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy =
    [hasHint ? hintId : "", hasError ? errorId : ""]
      .filter(Boolean)
      .join(" ") || undefined;

  return { inputId, hintId, errorId, describedBy };
}

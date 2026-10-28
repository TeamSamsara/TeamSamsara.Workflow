// File : /TeamSamsara.Workflow/app/src/lib/classNames.ts
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : Joins class names, skipping the empty ones, so components can add a caller's
// className or a state class without building strings by hand.

export function classNames(
  ...names: ReadonlyArray<string | false | null | undefined>
): string {
  return names.filter(Boolean).join(" ");
}

// File : /TeamSamsara.Workflow/app/src/shared/components/Chip/chipContent.ts
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : The text screen readers hear on a chip's remove button.

export const ChipText = {
  remove: (label: string) => `Remove ${label}`,
} as const;

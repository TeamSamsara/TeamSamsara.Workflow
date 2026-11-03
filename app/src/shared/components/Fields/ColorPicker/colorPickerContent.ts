// File : /TeamSamsara.Workflow/app/src/shared/components/Fields/ColorPicker/colorPickerContent.ts
// Version : 1.0.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : The words in the colour picker.

export const ColorPickerText = {
  label: "Colour",
  swatch: (name: string) => `Colour: ${name}`,
  custom: "Custom",
  customLabel: "Pick a custom colour",
} as const;

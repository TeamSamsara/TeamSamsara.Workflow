// File : /TeamSamsara.Workflow/app/src/features/roles/ui/roleDisplayFormContent.ts
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : The words on a role's Display tab and in its colour picker.

export const RoleDisplayFormText = {
  name: "Role name",
  color: "Colour",
  colorHint: "Shown next to names and on role chips.",
  description: "Description",
  descriptionHint: "What this role is for, so others know when to give it.",
  preview: "Preview",
  previewName: "Sam Rivera",
  previewDetail: "Planned Livestream · Thu, Dec 17",
} as const;

export const RoleColorPickerText = {
  swatch: (name: string) => `Colour: ${name}`,
  custom: "Custom",
  customLabel: "Pick a custom colour",
} as const;

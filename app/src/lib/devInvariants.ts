// File : /TeamSamsara.Workflow/app/src/lib/devInvariants.ts
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : Developer-facing invariant messages: text only a developer debugging a broken
// setup would ever see, never a real user.

export const DevInvariants = {
  dropdownPartOutsideDropdown:
    "Dropdown parts must be used inside a <Dropdown> component",
  tabsPartOutsideTabs: "Tabs parts must be used inside a <Tabs> component",
  useToastOutsideProvider: "useToast must be used within a ToastProvider",
} as const;

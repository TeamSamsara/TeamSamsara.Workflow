// File : /TeamSamsara.Workflow/app/src/lib/devInvariants.ts
// Version : 1.2.0
// Latest commit: core/session
// Author : Gerrah
// Purpose : Developer-facing invariant messages: text only a developer debugging a broken
// setup would ever see, never a real user.

export const DevInvariants = {
  dropdownPartOutsideDropdown:
    "Dropdown parts must be used inside a <Dropdown> component",
  tabsPartOutsideTabs: "Tabs parts must be used inside a <Tabs> component",
  useThemeOutsideProvider: "useTheme must be used within a ThemeProvider",
  useSessionOutsideProvider: "useSession must be used within a SessionProvider",
  missingRootElement:
    'index.html has no element with the id "root" to mount the app in',
  useToastOutsideProvider: "useToast must be used within a ToastProvider",
} as const;

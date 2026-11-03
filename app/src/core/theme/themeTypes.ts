// File : /TeamSamsara.Workflow/app/src/core/theme/themeTypes.ts
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : The theme choices a person can make, and the two themes a page can
// actually show.

export const ThemeChoices = ["light", "dark", "device"] as const;

/** What the person picked. "device" follows the operating system. */
export type ThemeChoice = (typeof ThemeChoices)[number];

/** What the page shows right now, once "device" is worked out. */
export type ResolvedTheme = Exclude<ThemeChoice, "device">;

export const DefaultThemeChoice: ThemeChoice = "device";

/** Matches when the device asks for dark mode. */
export const DeviceDarkQuery = "(prefers-color-scheme: dark)";

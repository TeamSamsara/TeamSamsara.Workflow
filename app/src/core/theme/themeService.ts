// File : /TeamSamsara.Workflow/app/src/core/theme/themeService.ts
// Version : 1.1.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : Reads and saves the theme choice, and shows it by setting data-theme
// on <html>, which colors.css reads. "device" removes the attribute, so the
// browser follows the operating system. A person's own choice is kept apart from
// the workspace's default, so "not chosen yet" can follow the workspace.

import { browserStorage } from "@/lib/browserStorage";
import { StorageKeys } from "@/shared/constants/storageKeys";
import { ThemeChoices, type ThemeChoice } from "./themeTypes";

const themeAttribute = "theme";

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return ThemeChoices.some((choice) => choice === value);
}

function readChoice(key: string): ThemeChoice | null {
  const stored = browserStorage.read(key);
  return isThemeChoice(stored) ? stored : null;
}

/** The person's saved choice, or null when they haven't picked one. */
export function readStoredThemeChoice(): ThemeChoice | null {
  return readChoice(StorageKeys.theme);
}

/** Saves the person's choice, "device" included, so it beats the workspace default. */
export function saveThemeChoice(choice: ThemeChoice): void {
  browserStorage.write(StorageKeys.theme, choice);
}

/** The workspace default seen on this browser last time, or null. */
export function readStoredDefaultTheme(): ThemeChoice | null {
  return readChoice(StorageKeys.themeDefault);
}

/** Remembers the workspace default for the next visit's first paint. */
export function saveDefaultTheme(choice: ThemeChoice): void {
  browserStorage.write(StorageKeys.themeDefault, choice);
}

/** Shows the choice on the page right away. */
export function applyThemeChoice(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === "device") {
    delete root.dataset[themeAttribute];
    return;
  }
  root.dataset[themeAttribute] = choice;
}

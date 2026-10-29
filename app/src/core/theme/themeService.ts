// File : /TeamSamsara.Workflow/app/src/core/theme/themeService.ts
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : Reads and saves the theme choice, and shows it by setting data-theme
// on <html>, which colors.css reads. "device" removes the attribute, so the
// browser follows the operating system.

import { browserStorage } from "@/lib/browserStorage";
import { StorageKeys } from "@/shared/constants/storageKeys";
import { ThemeChoices, type ThemeChoice } from "./themeTypes";

const themeAttribute = "theme";

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return ThemeChoices.some((choice) => choice === value);
}

/** The saved choice, or null when nothing (or nothing valid) is saved. */
export function readStoredThemeChoice(): ThemeChoice | null {
  const stored = browserStorage.read(StorageKeys.theme);
  return isThemeChoice(stored) ? stored : null;
}

/** Saves the choice. "device" is the default, so it clears the saved value instead. */
export function saveThemeChoice(choice: ThemeChoice): void {
  if (choice === "device") {
    browserStorage.remove(StorageKeys.theme);
    return;
  }
  browserStorage.write(StorageKeys.theme, choice);
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

// File : /TeamSamsara.Workflow/app/src/core/theme/ThemeProvider.tsx
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : Holds the theme choice for the whole app. It starts from the saved
// choice (index.html already showed it before React started), follows the device
// while set to "device", and saves and shows every change.

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { ThemeContext, type ThemeState } from "./ThemeContext";
import {
  applyThemeChoice,
  readStoredThemeChoice,
  saveThemeChoice,
} from "./themeService";
import {
  DefaultThemeChoice,
  DeviceDarkQuery,
  type ThemeChoice,
} from "./themeTypes";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [choice, setChoiceState] = useState<ThemeChoice>(
    () => readStoredThemeChoice() ?? DefaultThemeChoice,
  );
  const deviceIsDark = useMediaQuery(DeviceDarkQuery);

  const setChoice = useCallback((next: ThemeChoice) => {
    saveThemeChoice(next);
    applyThemeChoice(next);
    setChoiceState(next);
  }, []);

  const state = useMemo<ThemeState>(() => {
    const deviceTheme = deviceIsDark ? "dark" : "light";
    return {
      choice,
      resolved: choice === "device" ? deviceTheme : choice,
      setChoice,
    };
  }, [choice, deviceIsDark, setChoice]);

  return <ThemeContext value={state}>{children}</ThemeContext>;
}

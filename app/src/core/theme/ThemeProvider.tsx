// File : /TeamSamsara.Workflow/app/src/core/theme/ThemeProvider.tsx
// Version : 1.1.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : Holds the theme choice for the whole app. It starts from the saved
// choice (index.html already showed it before React started), falls back to the
// workspace default until the person picks one, follows the device while set to
// "device", and saves and shows every change.

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { ThemeContext, type ThemeState } from "./ThemeContext";
import {
  applyThemeChoice,
  readStoredDefaultTheme,
  readStoredThemeChoice,
  saveDefaultTheme,
  saveThemeChoice,
} from "./themeService";
import {
  DefaultThemeChoice,
  DeviceDarkQuery,
  type ThemeChoice,
} from "./themeTypes";

interface ThemeProviderProps {
  /** The workspace's default, for people who haven't picked a theme. Unknown while it loads. */
  defaultChoice?: ThemeChoice;
  children: ReactNode;
}

export function ThemeProvider({ defaultChoice, children }: ThemeProviderProps) {
  const [ownChoice, setOwnChoice] = useState<ThemeChoice | null>(
    readStoredThemeChoice,
  );
  const [rememberedDefault] = useState(readStoredDefaultTheme);
  const deviceIsDark = useMediaQuery(DeviceDarkQuery);

  const choice =
    ownChoice ?? defaultChoice ?? rememberedDefault ?? DefaultThemeChoice;

  // Before paint, so a change never shows the old colours for a frame.
  useLayoutEffect(() => {
    applyThemeChoice(choice);
  }, [choice]);

  useEffect(() => {
    if (defaultChoice) saveDefaultTheme(defaultChoice);
  }, [defaultChoice]);

  const setChoice = useCallback((next: ThemeChoice) => {
    saveThemeChoice(next);
    setOwnChoice(next);
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

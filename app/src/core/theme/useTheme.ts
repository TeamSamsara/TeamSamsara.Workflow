// File : /TeamSamsara.Workflow/app/src/core/theme/useTheme.ts
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : Reads ThemeContext, and fails loudly when used outside ThemeProvider.

import { useContext } from "react";
import { DevInvariants } from "@/lib/devInvariants";
import { ThemeContext, type ThemeState } from "./ThemeContext";

export function useTheme(): ThemeState {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error(DevInvariants.useThemeOutsideProvider);
  }
  return context;
}

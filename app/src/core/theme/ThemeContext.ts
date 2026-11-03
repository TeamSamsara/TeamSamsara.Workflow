// File : /TeamSamsara.Workflow/app/src/core/theme/ThemeContext.ts
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : The context that shares the theme choice owned by ThemeProvider.
// Context only; the hook that reads it is useTheme.

import { createContext } from "react";
import type { ResolvedTheme, ThemeChoice } from "./themeTypes";

export interface ThemeState {
  /** What the person picked. */
  choice: ThemeChoice;
  /** What the page shows right now. */
  resolved: ResolvedTheme;
  setChoice: (choice: ThemeChoice) => void;
}

export const ThemeContext = createContext<ThemeState | undefined>(undefined);

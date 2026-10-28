// File : /TeamSamsara.Workflow/app/src/shared/components/Tabs/TabsContext.ts
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : The context that lets the tabs parts (list, tab, panel) read and change the
// picked tab owned by <Tabs>. Context only; the hook that reads it is useTabsContext.

import { createContext } from "react";

export interface TabsState {
  value: string;
  select: (value: string) => void;
  /** Id of the tab for a value, so its panel can point back at it. */
  tabId: (value: string) => string;
  /** Id of the panel for a value, so its tab can point at it. */
  panelId: (value: string) => string;
}

export const TabsContext = createContext<TabsState | undefined>(undefined);

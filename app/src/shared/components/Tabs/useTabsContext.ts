// File : /TeamSamsara.Workflow/app/src/shared/components/Tabs/useTabsContext.ts
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : Reads TabsContext for the tabs parts, and fails loudly if a part is used
// outside <Tabs>.

import { useContext } from "react";
import { DevInvariants } from "@/lib/devInvariants";
import { TabsContext, type TabsState } from "./TabsContext";

export function useTabsContext(): TabsState {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(DevInvariants.tabsPartOutsideTabs);
  }
  return context;
}

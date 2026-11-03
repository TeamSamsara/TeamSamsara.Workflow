// File : /TeamSamsara.Workflow/app/src/shared/components/Tabs/Tabs.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : The root of a set of tabs that switch content on the same page (the platforms of
// a post). The caller owns which tab is picked; the parts share it through context. For tabs
// that go to other pages, use NavTabs.

import { useId, useMemo, type ReactNode } from "react";
import { TabsContext, type TabsState } from "./TabsContext";

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

export function Tabs({ value, onValueChange, children }: TabsProps) {
  const baseId = useId();

  const state = useMemo<TabsState>(
    () => ({
      value,
      select: onValueChange,
      tabId: (tabValue) => `${baseId}-tab-${tabValue}`,
      panelId: (tabValue) => `${baseId}-panel-${tabValue}`,
    }),
    [value, onValueChange, baseId],
  );

  return <TabsContext value={state}>{children}</TabsContext>;
}

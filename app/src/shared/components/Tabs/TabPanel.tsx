// File : /TeamSamsara.Workflow/app/src/shared/components/Tabs/TabPanel.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : The content of one tab. Only the picked tab's panel is in the page.

import type { ReactNode } from "react";
import { classNames } from "@/lib/classNames";
import { useTabsContext } from "./useTabsContext";
import styles from "./Tabs.module.css";

interface TabPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ value, children, className }: TabPanelProps) {
  const { value: selected, tabId, panelId } = useTabsContext();
  if (value !== selected) return null;

  return (
    <div
      role="tabpanel"
      id={panelId(value)}
      aria-labelledby={tabId(value)}
      tabIndex={0}
      className={classNames(styles.panel, className)}
    >
      {children}
    </div>
  );
}

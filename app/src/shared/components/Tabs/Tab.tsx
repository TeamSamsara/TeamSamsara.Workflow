// File : /TeamSamsara.Workflow/app/src/shared/components/Tabs/Tab.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : One tab. Only the picked tab can be reached with Tab; the arrows reach the others.

import type { ReactNode } from "react";
import { useTabsContext } from "./useTabsContext";
import styles from "./Tabs.module.css";

interface TabProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
}

export function Tab({ value, children, disabled = false }: TabProps) {
  const { value: selected, select, tabId, panelId } = useTabsContext();
  const isSelected = value === selected;

  return (
    <button
      type="button"
      role="tab"
      id={tabId(value)}
      className={styles.tab}
      aria-selected={isSelected}
      aria-controls={panelId(value)}
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      onClick={() => select(value)}
    >
      {children}
    </button>
  );
}

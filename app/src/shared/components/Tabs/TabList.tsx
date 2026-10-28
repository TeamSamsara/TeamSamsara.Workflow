// File : /TeamSamsara.Workflow/app/src/shared/components/Tabs/TabList.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : The row of tabs. Left and right arrows (and Home and End) move to the next tab
// and pick it, the way screen reader users expect; Tab moves on to the panel.

import type { KeyboardEvent, ReactNode } from "react";
import { classNames } from "@/lib/classNames";
import styles from "./Tabs.module.css";

interface TabListProps {
  /** Names the tabs for screen readers (e.g. "Platforms"). */
  label: string;
  children: ReactNode;
  className?: string;
}

const tabSelector = '[role="tab"]:not(:disabled)';

export function TabList({ label, children, className }: TabListProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(tabSelector),
    );
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;

    const moves: Record<string, number> = {
      ArrowRight: (current + 1) % tabs.length,
      ArrowLeft: (current - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;

    event.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={classNames(styles.list, className)}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}

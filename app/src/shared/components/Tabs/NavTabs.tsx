// File : /TeamSamsara.Workflow/app/src/shared/components/Tabs/NavTabs.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : Tabs that are really links to other pages (a role's Display, Permissions and
// Members). They look like Tabs but are a navigation list, and the current page is marked
// by the router.

import { NavLink } from "react-router-dom";
import { classNames } from "@/lib/classNames";
import styles from "./Tabs.module.css";

export interface NavTabItem {
  to: string;
  label: string;
  /** Only mark this tab when the address matches exactly, not a page under it. */
  end?: boolean;
}

interface NavTabsProps {
  /** Names the links for screen readers (e.g. "Role sections"). */
  label: string;
  items: readonly NavTabItem[];
  className?: string;
}

export function NavTabs({ label, items, className }: NavTabsProps) {
  return (
    <nav aria-label={label} className={className}>
      <ul className={classNames(styles.list, styles.navList)}>
        {items.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.end} className={styles.tab}>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// File : /TeamSamsara.Workflow/app/src/app/layouts/AppLayout/Sidebar.tsx
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : The dark sidebar: the logo, the main menu, and the account link with
// the theme toggle at the bottom. On narrow screens it slides in as a menu and is
// out of reach (inert) while closed.

import { NavLink } from "react-router-dom";
import { ThemeToggle } from "@/core/theme";
import { classNames } from "@/lib/classNames";
import { Branding } from "@/shared/constants/branding";
import { RoutePaths } from "@/shared/constants/routePaths";
import { Icon } from "@/shared/icons/Icon";
import { navItems } from "./navItems";
import { SidebarText } from "./sidebarContent";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  id: string;
  /** True on narrow screens, where the sidebar is a slide-in menu. */
  isCompact: boolean;
  /** Whether the slide-in menu is open. Ignored on wide screens. */
  isOpen: boolean;
  className?: string;
}

export function Sidebar({ id, isCompact, isOpen, className }: SidebarProps) {
  return (
    <aside
      id={id}
      className={classNames(styles.sidebar, className)}
      data-open={isOpen}
      inert={isCompact && !isOpen}
    >
      <div className={styles.brand}>
        <img src={Branding.logoSrc} alt="" className={styles.logo} />
        <span className={styles.appName}>{Branding.appName}</span>
      </div>

      <nav aria-label={SidebarText.mainMenu} className={styles.menu}>
        <ul className={styles.list}>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} className={styles.link}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.footer}>
        <NavLink to={RoutePaths.account} className={styles.account}>
          <Icon name="user" />
          <span>{SidebarText.account}</span>
        </NavLink>
        <ThemeToggle surface="nav" />
      </div>
    </aside>
  );
}

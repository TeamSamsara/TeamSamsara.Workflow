// File : /TeamSamsara.Workflow/app/src/app/layouts/AppLayout/Sidebar.tsx
// Version : 1.4.0
// Latest commit: feature/your-account
// Author : Gerrah
// Purpose : The dark sidebar: the logo with the workspace's name, the main menu
// (only the items the member may use), and the account link with the theme
// toggle at the bottom. On narrow screens it slides in as a menu and is out of
// reach (inert) while closed.

import { NavLink } from "react-router-dom";
import { usePermissions } from "@/core/access";
import { useSession } from "@/core/session";
import { ThemeToggle } from "@/core/theme";
import { useWorkspaceRecord } from "@/core/workspace";
import { memberName } from "@/features/members";
import { classNames } from "@/lib/classNames";
import { Avatar } from "@/shared/components/Avatar/Avatar";
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
  const { canAny } = usePermissions();
  const workspace = useWorkspaceRecord();
  const session = useSession();
  const member = session.status === "active" ? session.member : null;
  const visibleItems = navItems.filter(
    (item) => !item.requiresAnyOf || canAny(item.requiresAnyOf),
  );

  return (
    <aside
      id={id}
      className={classNames(styles.sidebar, className)}
      data-open={isOpen}
      inert={isCompact && !isOpen}
    >
      <div className={styles.brand}>
        <img src={Branding.logoSrc} alt="" className={styles.logo} />
        <span className={styles.brandText}>
          <span className={styles.appName}>{Branding.appName}</span>
          <span className={styles.workspaceName}>{workspace.name}</span>
        </span>
      </div>

      <nav aria-label={SidebarText.mainMenu} className={styles.menu}>
        <ul className={styles.list}>
          {visibleItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={styles.link}
                data-sub={item.sub || undefined}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.footer}>
        <NavLink to={RoutePaths.account} className={styles.account}>
          {member ? (
            <Avatar name={memberName(member)} size="small" />
          ) : (
            <Icon name="user" />
          )}
          <span className={styles.accountText}>
            {member ? (
              <b className={styles.accountName}>{memberName(member)}</b>
            ) : null}
            <span>{SidebarText.account}</span>
          </span>
        </NavLink>
        <ThemeToggle surface="nav" />
      </div>
    </aside>
  );
}

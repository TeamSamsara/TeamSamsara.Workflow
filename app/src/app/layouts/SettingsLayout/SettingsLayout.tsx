// File : /TeamSamsara.Workflow/app/src/app/layouts/SettingsLayout/SettingsLayout.tsx
// Version : 1.1.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : The frame around every settings page: the Settings title, the
// settings menu (only the pages the member may open) on the left and the page
// on the right. The menu moves above the
// page when there is no room beside it.

import { NavLink, Outlet } from "react-router-dom";
import { usePermissions } from "@/core/access";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { settingsNav } from "./settingsNav";
import { SettingsLayoutText } from "./settingsLayoutContent";
import styles from "./SettingsLayout.module.css";

export function SettingsLayout() {
  const { can } = usePermissions();
  const visibleItems = settingsNav.filter((item) => can(item.requires));

  return (
    <div className={styles.layout}>
      <PageHeader title={SettingsLayoutText.title} />
      <div className={styles.body}>
        <nav aria-label={SettingsLayoutText.menuLabel} className={styles.menu}>
          <ul className={styles.list}>
            {visibleItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={styles.link}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.page}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

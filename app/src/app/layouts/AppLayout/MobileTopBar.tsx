// File : /TeamSamsara.Workflow/app/src/app/layouts/AppLayout/MobileTopBar.tsx
// Version : 1.1.0
// Latest commit: feature/notifications
// Author : Gerrah
// Purpose : The bar across the top on narrow screens: the logo and app name, and
// the button that opens and closes the sidebar menu.

import { NotificationBell } from "@/features/notifications";
import { IconButton } from "@/shared/components/Button/IconButton";
import { Branding } from "@/shared/constants/branding";
import { AppLayoutText } from "./appLayoutContent";
import styles from "./MobileTopBar.module.css";

interface MobileTopBarProps {
  isMenuOpen: boolean;
  /** Id of the sidebar the button controls. */
  sidebarId: string;
  onToggleMenu: () => void;
}

export function MobileTopBar({
  isMenuOpen,
  sidebarId,
  onToggleMenu,
}: MobileTopBarProps) {
  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <img src={Branding.logoSrc} alt="" className={styles.logo} />
        <span className={styles.appName}>{Branding.appName}</span>
      </div>
      <span className={styles.actions}>
        <NotificationBell opens="page" />
        <IconButton
          icon={isMenuOpen ? "close" : "menu"}
          label={isMenuOpen ? AppLayoutText.closeMenu : AppLayoutText.openMenu}
          variant="ghost"
          aria-expanded={isMenuOpen}
          aria-controls={sidebarId}
          onClick={onToggleMenu}
        />
      </span>
    </header>
  );
}

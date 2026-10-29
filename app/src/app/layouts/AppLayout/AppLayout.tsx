// File : /TeamSamsara.Workflow/app/src/app/layouts/AppLayout/AppLayout.tsx
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : The frame around every signed-in page: the sidebar and the page area.
// On narrow screens the sidebar becomes a slide-in menu behind a top bar button,
// and it closes when the page changes, on Esc, or on a tap outside it.

import { useCallback, useEffect, useId, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { atOrBelow } from "@/shared/constants/breakpoints";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { MobileTopBar } from "./MobileTopBar";
import { Sidebar } from "./Sidebar";
import { AppLayoutText } from "./appLayoutContent";
import styles from "./AppLayout.module.css";

const mainContentId = "main-content";

export function AppLayout() {
  const sidebarId = useId();
  const isCompact = useMediaQuery(atOrBelow("medium"));
  const { pathname } = useLocation();

  // The menu remembers the page it was opened on, so going to another page closes it.
  const [menuOpenedOn, setMenuOpenedOn] = useState<string | null>(null);
  const isMenuOpen = isCompact && menuOpenedOn === pathname;

  const closeMenu = useCallback(() => setMenuOpenedOn(null), []);
  const toggleMenu = useCallback(
    () => setMenuOpenedOn(isMenuOpen ? null : pathname),
    [isMenuOpen, pathname],
  );

  useEffect(() => {
    if (!isMenuOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen, closeMenu]);

  return (
    <div className={styles.shell}>
      <a href={`#${mainContentId}`} className={styles.skipLink}>
        {AppLayoutText.skipToContent}
      </a>

      {isCompact ? (
        <MobileTopBar
          isMenuOpen={isMenuOpen}
          sidebarId={sidebarId}
          onToggleMenu={toggleMenu}
        />
      ) : null}

      <Sidebar
        id={sidebarId}
        isCompact={isCompact}
        isOpen={isMenuOpen}
        className={styles.sidebar}
      />

      {isMenuOpen ? (
        <div className={styles.backdrop} onClick={closeMenu} aria-hidden />
      ) : null}

      <main id={mainContentId} className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}

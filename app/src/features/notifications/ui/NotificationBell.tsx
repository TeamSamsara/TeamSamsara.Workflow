// File : /TeamSamsara.Workflow/app/src/features/notifications/ui/NotificationBell.tsx
// Version : 1.0.0
// Latest commit: feature/notifications
// Author : Gerrah
// Purpose : The bell with the unread count. In the sidebar it opens the list
// in a panel beside it (closed by Escape, a click outside, or opening one); in
// the phone's top bar it goes to the list's own page.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Icon } from "@/shared/icons/Icon";
import { RoutePaths } from "@/shared/constants/routePaths";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationList } from "./NotificationList";
import { NotificationListText as Text } from "./notificationsContent";
import styles from "./NotificationBell.module.css";

interface NotificationBellProps {
  /** "page" links to the list's page instead of opening the panel. */
  opens?: "panel" | "page";
}

function Count({ unread }: { unread: number }) {
  return unread > 0 ? (
    <span className={styles.count} aria-hidden="true">
      {unread > 99 ? "99+" : unread}
    </span>
  ) : null;
}

export function NotificationBell({ opens = "panel" }: NotificationBellProps) {
  const { unread } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function closeOnOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (!root.current?.contains(target) && !panel.current?.contains(target))
        setIsOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      button.current?.focus();
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  if (opens === "page") {
    return (
      <Link
        to={RoutePaths.notifications}
        className={styles.bell}
        aria-label={Text.bell(unread)}
      >
        <Icon name="notifications" />
        <Count unread={unread} />
      </Link>
    );
  }

  return (
    <div ref={root} className={styles.root}>
      <button
        ref={button}
        type="button"
        className={styles.bell}
        aria-label={Text.bell(unread)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((open) => !open)}
      >
        <Icon name="notifications" />
        <Count unread={unread} />
      </button>
      {isOpen
        ? // Drawn at the top of the page, above everything the sidebar layers under.
          createPortal(
            <div
              ref={panel}
              className={styles.panel}
              role="dialog"
              aria-label={Text.title}
            >
              <NotificationList onOpen={() => setIsOpen(false)} />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

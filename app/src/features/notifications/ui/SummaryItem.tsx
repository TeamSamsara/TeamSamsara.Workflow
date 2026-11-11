// File : /TeamSamsara.Workflow/app/src/features/notifications/ui/SummaryItem.tsx
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The extra part of a summary notification, under its sentence:
// count chips (tasks for you, for each of your groups, the events you're in)
// and Show the tasks, which lists your first few tasks and a link to the rest.

import { useState } from "react";
import { Link } from "react-router-dom";
import { RoutePaths } from "@/shared/constants/routePaths";
import type { NotificationSummary } from "../types/notificationTypes";
import { NotificationListText } from "./notificationsContent";
import styles from "./NotificationList.module.css";

const Text = NotificationListText.summary;

interface SummaryItemProps {
  summary: NotificationSummary;
  /** "tasksMoved" counts moved tasks; "setPlanned" counts planned ones. */
  moved: boolean;
  groupName: (id: string) => string | null;
  formatDue: (date: Date) => string;
  onOpen?: () => void;
}

export function SummaryItem({
  summary,
  moved,
  groupName,
  formatDue,
  onOpen,
}: SummaryItemProps) {
  const [open, setOpen] = useState(false);
  const total =
    summary.mine + summary.groups.reduce((sum, group) => sum + group.count, 0);
  const chips = [
    moved
      ? total > 0
        ? Text.moved(total)
        : null
      : summary.mine > 0
        ? Text.forYou(summary.mine)
        : null,
    ...(moved
      ? []
      : summary.groups.map((group) =>
          Text.forGroup(group.count, groupName(group.id) ?? "your group"),
        )),
    !moved && summary.inEvents > 0
      ? Text.inEvents(summary.inEvents, summary.eventCount)
      : null,
  ].filter((chip): chip is string => chip !== null);

  return (
    <div className={styles.summary}>
      {chips.length > 0 ? (
        <div className={styles.chips}>
          {chips.map((chip) => (
            <span key={chip} className={styles.chip}>
              {chip}
            </span>
          ))}
        </div>
      ) : null}
      {summary.lines.length > 0 ? (
        <>
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? Text.hide : Text.show}
          </button>
          {open ? (
            <ul className={styles.lines}>
              {summary.lines.map((line) => (
                <li key={`${line.title}:${line.events}`}>
                  {Text.line(
                    line.title,
                    line.events,
                    line.firstDue ? formatDue(line.firstDue) : null,
                  )}
                </li>
              ))}
              <li>
                <Link to={RoutePaths.myTasks} onClick={onOpen}>
                  {Text.seeAll}
                </Link>
              </li>
            </ul>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

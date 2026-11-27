// File : /TeamSamsara.Workflow/app/src/views/calendar/CalendarsView.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-calendars-lists
// Author : Gerrah
// Purpose : Every calendar the member can open, as cards: theirs first (My
// calendar, all their groups, each of their groups), then, for people who see
// every event, the other groups and Everything. Each card says how many
// events it has this week and what's next, and opens the calendar on its own
// page (it replaces the calendar picker). Calendar in the menu opens My
// calendar.

import { weekOf } from "@engine/workload";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useSession } from "@/core/session";
import { useDisplayTime, useWorkspaceRecord } from "@/core/workspace";
import {
  useAudienceOptions,
  useEventsInRange,
  useSeesAllEvents,
  type CalendarScope,
} from "@/features/events";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { calendarPath, RoutePaths } from "@/shared/constants/routePaths";
import { useNow } from "@/shared/hooks/useNow";
import { formatTime } from "@/shared/time/dates";
import { CalendarsViewText as Text } from "./calendarViewContent";
import styles from "./CalendarsView.module.css";

interface CalendarCardProps {
  scope: CalendarScope;
  value: string;
  name: string;
  kind: string | null;
  description: string;
  week: { start: Date; end: Date };
}

function CalendarCard({
  scope,
  value,
  name,
  kind,
  description,
  week,
}: CalendarCardProps) {
  const session = useSession();
  const time = useDisplayTime();
  const now = useNow();
  const member = session.status === "active" ? session.member : null;
  const viewer = useMemo(
    () =>
      member ? { id: member.id, workGroupIds: member.workGroupIds } : null,
    [member],
  );
  const events = useEventsInRange(week.start, week.end, scope, viewer);
  const next = [...events.items]
    .filter((event) => event.startsAt >= now)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];
  const weekday = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: time.timeZone,
    }).format(date);

  return (
    <Link to={calendarPath(value)} className={styles.card}>
      <span className={styles.head}>
        <b className={styles.name}>{name}</b>
        {kind ? <span className={styles.kind}>{kind}</span> : null}
      </span>
      <span className={styles.muted}>{description}</span>
      <span className={styles.facts}>
        <span className={styles.label}>{Text.thisWeek}</span>
        <b>
          {events.status === "ready" ? Text.events(events.items.length) : "…"}
        </b>
        {next ? (
          <span className={styles.muted}>
            {Text.next(
              next.title,
              `${weekday(next.startsAt)} ${formatTime(next.startsAt, time.timeZone, time.timeFormat)}`,
            )}
          </span>
        ) : null}
      </span>
      <span className={styles.open}>{Text.open}</span>
    </Link>
  );
}

export function CalendarsView() {
  const session = useSession();
  const workspace = useWorkspaceRecord();
  const now = useNow();
  const seesAll = useSeesAllEvents();
  const people = useAudienceOptions();
  const mine = session.status === "active" ? session.member.workGroupIds : [];
  const week = weekOf(now, workspace.timeZone, workspace.weekStartsOn);
  const groups = [...people.groups].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const yourGroups = groups.filter((group) => mine.includes(group.id));
  const otherGroups = groups.filter((group) => !mine.includes(group.id));

  return (
    <div className={styles.page}>
      <PageHeader
        title={Text.title}
        description={Text.description}
        actions={
          <LinkButton
            to={RoutePaths.newEvent}
            iconStart="add"
            variant="primary"
          >
            {Text.newEvent}
          </LinkButton>
        }
      />
      <section className={styles.section} aria-labelledby="calendars-yours">
        <h2 id="calendars-yours" className={styles.sectionTitle}>
          {Text.yours}
        </h2>
        <div className={styles.grid}>
          <CalendarCard
            scope={{ kind: "mine" }}
            value="mine"
            name={Text.mine}
            kind={Text.fromMenu}
            description={Text.mineDescription}
            week={week}
          />
          {yourGroups.length > 1 ? (
            <CalendarCard
              scope={{ kind: "groups" }}
              value="groups"
              name={Text.allMyGroups}
              kind={null}
              description={Text.allMyGroupsDescription}
              week={week}
            />
          ) : null}
          {yourGroups.map((group) => (
            <CalendarCard
              key={group.id}
              scope={{ kind: "group", groupId: group.id }}
              value={group.id}
              name={group.name}
              kind={Text.yourGroup}
              description={Text.groupDescription}
              week={week}
            />
          ))}
        </div>
      </section>
      {seesAll ? (
        <section className={styles.section} aria-labelledby="calendars-all">
          <h2 id="calendars-all" className={styles.sectionTitle}>
            {Text.everyone}
          </h2>
          <p className={styles.muted}>{Text.everyoneNote}</p>
          <div className={styles.grid}>
            {otherGroups.map((group) => (
              <CalendarCard
                key={group.id}
                scope={{ kind: "group", groupId: group.id }}
                value={group.id}
                name={group.name}
                kind={null}
                description={Text.groupDescription}
                week={week}
              />
            ))}
            <CalendarCard
              scope={{ kind: "all" }}
              value="all"
              name={Text.everything}
              kind={null}
              description={Text.everythingDescription}
              week={week}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

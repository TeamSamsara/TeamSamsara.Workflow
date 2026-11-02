// File : /TeamSamsara.Workflow/app/src/views/availability/TeamAvailabilityView.tsx
// Version : 1.2.0
// Latest commit: feature/your-account
// Author : Gerrah
// Purpose : A work group's week of availability, for See everyone's
// availability: who's free when, their personal appointments, clashes with the
// group's events, and the times when everyone's free (each opens New event at
// that time). The week and the group are kept in the address.

import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { isCurrentMember } from "@/core/data";
import { useSession } from "@/core/session";
import { useDisplayTime, useWorkspaceRecord } from "@/core/workspace";
import {
  bestTimes,
  TeamAvailabilityGrid,
  TeamText as Text,
  useAllAvailability,
  useBusyInRange,
  usePersonalInRange,
  type PersonTime,
} from "@/features/availability";
import { CalendarText, useEventsInRange } from "@/features/events";
import { memberName, memberSubName } from "@/features/members";
import { useWorkGroups } from "@/features/work-groups";
import { HelpTip } from "@/shared/components/HelpTip/HelpTip";
import { Button } from "@/shared/components/Button/Button";
import { IconButton } from "@/shared/components/Button/IconButton";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { Select } from "@/shared/components/Fields/Select/Select";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { RoutePaths } from "@/shared/constants/routePaths";
import { useNow } from "@/shared/hooks/useNow";
import { formatTime } from "@/shared/time/dates";
import {
  addDayKeys,
  formatWeek,
  parseDayKey,
  weekOf,
} from "@/shared/time/weekGrid";
import { toWallTime } from "@/shared/time/zonedTime";
import { dayKey } from "@/shared/time/dates";
import { AvailabilityViewText as ViewText } from "./availabilityViewContent";
import styles from "./AvailabilityViews.module.css";

/** The colours of the grid, explained behind the "?" by the week. */
const LegendKinds = ["available", "unavailable", "busy", "clash"] as const;

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export function TeamAvailabilityView() {
  const workspace = useWorkspaceRecord();
  const session = useSession();
  const member = session.status === "active" ? session.member : null;
  const groups = useWorkGroups();
  const now = useNow();
  const [params, setParams] = useSearchParams();
  // Shown in the person's own zone; links to New event use the workspace's.
  const time = useDisplayTime();
  const tz = time.timeZone;
  const today = dayKey(now, tz);
  const week = useMemo(
    () =>
      weekOf(
        parseDayKey(params.get("week")) ?? today,
        workspace.weekStartsOn,
        tz,
        now,
      ),
    [params, today, workspace.weekStartsOn, tz, now],
  );

  const mine = member?.workGroupIds ?? [];
  const sorted = [...groups.items].sort(
    (a, b) =>
      Number(mine.includes(b.group.id)) - Number(mine.includes(a.group.id)) ||
      a.group.name.localeCompare(b.group.name),
  );
  const groupId = params.get("group") ?? sorted[0]?.group.id ?? null;
  const current =
    groups.items.find((item) => item.group.id === groupId) ?? null;
  const people = (current?.members ?? [])
    .filter(isCurrentMember)
    .map((record) => ({
      id: record.id,
      name: memberName(record),
      subName: memberSubName(record),
      initials: initialsOf(memberName(record)),
    }));

  const availability = useAllAvailability();
  const busy = useBusyInRange(week.start, week.end);
  const personal = usePersonalInRange("all", week.start, week.end);
  const viewer = member
    ? { id: member.id, workGroupIds: member.workGroupIds }
    : null;
  const events = useEventsInRange(
    week.start,
    week.end,
    groupId ? { kind: "group", groupId } : { kind: "mine" },
    viewer,
  );

  const timeFor = (memberId: string): PersonTime => ({
    availability: availability.get(memberId) ?? null,
    busy: busy
      .filter((entry) => entry.memberId === memberId)
      .map((entry) => ({
        ...entry,
        title: personal.find((own) => own.id === entry.id)?.title,
      })),
  });
  const timeOf = (date: Date) => formatTime(date, tz, time.timeFormat);
  const spanLabel = (start: Date, end: Date) =>
    `${timeOf(start)} – ${timeOf(end)}`;
  const best = bestTimes(week.days, people, timeFor, tz, now);
  const weekdayNames = CalendarText.weekdays[workspace.weekStartsOn];
  const weekdayOf = (date: Date) => {
    const index = week.days.findIndex(
      (day) => date >= day.start && date < day.end,
    );
    return weekdayNames[index] ?? "";
  };

  function setParam(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title={ViewText.team}
        breadcrumbs={[
          { label: ViewText.calendar, to: RoutePaths.calendar },
          { label: ViewText.team },
        ]}
        description={ViewText.teamIntro}
        actions={
          <LinkButton to={RoutePaths.availability} iconStart="user">
            {ViewText.mine}
          </LinkButton>
        }
      />

      {groups.status === "ready" && groups.items.length === 0 ? (
        <p className={styles.muted}>{ViewText.noGroups}</p>
      ) : (
        <>
          <div className={styles.toolbar}>
            <div className={styles.weekNav}>
              <h2 className={styles.weekTitle}>{formatWeek(week)}</h2>
              <HelpTip topic={Text.legend.topic}>
                <span className={styles.legend}>
                  {LegendKinds.map((kind) => (
                    <span key={kind} className={styles.legendItem}>
                      <span className={styles.swatch} data-kind={kind} />
                      {Text.legend[kind]}
                    </span>
                  ))}
                </span>
              </HelpTip>
              <IconButton
                icon="previous"
                variant="ghost"
                label={ViewText.previousWeek}
                onClick={() => setParam({ week: addDayKeys(week.key, -7) })}
              />
              <IconButton
                icon="next"
                variant="ghost"
                label={ViewText.nextWeek}
                onClick={() => setParam({ week: addDayKeys(week.key, 7) })}
              />
              <Button
                variant="ghost"
                size="small"
                onClick={() => setParam({ week: null })}
              >
                {ViewText.thisWeek}
              </Button>
            </div>
            <Select
              label={ViewText.group}
              options={sorted.map((item) => ({
                value: item.group.id,
                label: item.group.name,
              }))}
              value={groupId ?? ""}
              onChange={(event) => setParam({ group: event.target.value })}
              className={styles.picker}
            />
          </div>

          <TeamAvailabilityGrid
            days={week.days}
            weekdayNames={weekdayNames}
            people={people}
            timeFor={timeFor}
            events={events.items.map((event) => ({
              id: event.id,
              title: event.title,
              start: event.startsAt,
              end: event.endsAt,
            }))}
            groupName={current?.group.name ?? ""}
            timeZone={tz}
            spanLabel={spanLabel}
          />

          <section className={styles.best} aria-labelledby="best-times">
            <h2 id="best-times" className={styles.bestTitle}>
              {Text.bestTimes(current?.group.name ?? "")}
            </h2>
            {best.length === 0 ? (
              <span className={styles.muted}>{Text.noBest}</span>
            ) : (
              <>
                {best.slice(0, 8).map((slot) => {
                  const wall = toWallTime(slot.start, workspace.timeZone);
                  const date = dayKey(slot.start, workspace.timeZone);
                  const time = `${String(wall.hour).padStart(2, "0")}:${String(wall.minute).padStart(2, "0")}`;
                  return (
                    <Link
                      key={slot.start.getTime()}
                      to={`${RoutePaths.newEvent}?date=${date}&time=${time}${groupId ? `&group=${groupId}` : ""}`}
                      className={styles.chip}
                    >
                      {weekdayOf(slot.start)} {spanLabel(slot.start, slot.end)}
                    </Link>
                  );
                })}
                <span className={styles.muted}>{Text.bestNote}</span>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}

// File : /TeamSamsara.Workflow/app/src/views/availability/TeamAvailabilityView.tsx
// Version : 2.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : A work group's week of availability, for See everyone's
// availability. On the left, its people grouped by people tag: tick a tag or
// a name to compare them, drag to reorder (saved for the viewer). In the
// middle, Hours (a grid of how many of them are free each hour) or People
// (each person's free hours per day). On the right, the picked hour: who's
// free, busy or hasn't filled in, Plan an event then, and the times everyone
// shown is free. Times show in the team's zone or the viewer's own. Nothing
// depends on hovering. The week, group and view are kept in the address.

import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePermissions } from "@/core/access";
import { isCurrentMember } from "@/core/data";
import { useSession } from "@/core/session";
import { useDisplayTime, useWorkspaceRecord } from "@/core/workspace";
import {
  everyoneFree,
  FirstHour,
  freeStretches,
  HourPanel,
  hoursApart,
  hourRows,
  sectionsOf,
  reorderSection,
  TeamHourGrid,
  TeamPeopleList,
  TeamViewText as Team,
  useAllAvailability,
  useBusyInRange,
  usePersonalInRange,
  useTeamViewPrefs,
  ZoneSwitch,
  zoneFor,
  type DayCell,
  type PanelPerson,
  type PersonTime,
  type TeamRowPerson,
} from "@/features/availability";
import { CalendarText } from "@/features/events";
import { memberName } from "@/features/members";
import { usePeopleTags } from "@/features/people-tags";
import { TourTarget } from "@/features/onboarding";
import { useWorkGroups } from "@/features/work-groups";
import { Button } from "@/shared/components/Button/Button";
import { IconButton } from "@/shared/components/Button/IconButton";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { Select } from "@/shared/components/Fields/Select/Select";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import { RoutePaths } from "@/shared/constants/routePaths";
import { useNow } from "@/shared/hooks/useNow";
import { dayKey, formatTime } from "@/shared/time/dates";
import { zoneCity } from "@/shared/time/timeZones";
import {
  addDayKeys,
  formatWeek,
  parseDayKey,
  weekOf,
} from "@/shared/time/weekGrid";
import { toWallTime } from "@/shared/time/zonedTime";
import { AvailabilityViewText as ViewText } from "./availabilityViewContent";
import styles from "./AvailabilityViews.module.css";

type SeeBy = "hours" | "people";

const pad = (value: number) => String(value).padStart(2, "0");

export function TeamAvailabilityView() {
  const workspace = useWorkspaceRecord();
  const session = useSession();
  const member = session.status === "active" ? session.member : null;
  const access = usePermissions();
  const groups = useWorkGroups();
  const tags = usePeopleTags();
  const now = useNow();
  const time = useDisplayTime();
  const view = useTeamViewPrefs();
  const [params, setParams] = useSearchParams();
  const [isTagging, setIsTagging] = useState(false);
  const [pickedAt, setPickedAt] = useState<{
    day: number;
    hour: number;
  } | null>(null);

  // Times show in the team's zone or the viewer's own.
  const ownZone = member?.timeZone ?? workspace.timeZone;
  const tz = zoneFor(
    view.prefs.zone,
    workspace.timeZone,
    member?.timeZone ?? null,
  );
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
  const seeBy: SeeBy = params.get("by") === "people" ? "people" : "hours";

  const mine = member?.workGroupIds ?? [];
  const sorted = [...groups.items].sort(
    (a, b) =>
      Number(mine.includes(b.group.id)) - Number(mine.includes(a.group.id)) ||
      a.group.name.localeCompare(b.group.name),
  );
  const groupId = params.get("group") ?? sorted[0]?.group.id ?? null;
  const current =
    groups.items.find((item) => item.group.id === groupId) ?? null;

  const availability = useAllAvailability();
  const busy = useBusyInRange(week.start, week.end);
  const personal = usePersonalInRange(
    member?.id ?? null,
    week.start,
    week.end,
    {
      shared: true,
    },
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

  const people: TeamRowPerson[] = (current?.members ?? [])
    .filter(isCurrentMember)
    .map((record) => ({
      id: record.id,
      name: memberName(record),
      tagIds: record.tagIds,
      photoUrl: record.photoUrl,
      filled: availability.has(record.id),
      time: timeFor(record.id),
    }));
  const hidden = new Set(view.prefs.hidden);
  const sections = sectionsOf(
    people,
    tags.items.map((tag) => tag.id),
    view.prefs.order,
  );
  const shown = people.filter((person) => !hidden.has(person.id));
  const compared = shown.filter((person) => person.filled);
  const rows = hourRows(week.days, shown, tz);

  // The picked hour: the one asked for, else the next hour today, else 6 PM
  // on the first day.
  const todayIndex = week.days.findIndex((day) => day.key === today);
  const nextHour = toWallTime(now, tz).hour + 1;
  const picked = pickedAt ?? {
    day: Math.max(0, todayIndex),
    hour:
      todayIndex >= 0 && nextHour >= FirstHour && nextHour < 24 ? nextHour : 18,
  };
  const cell = rows[picked.hour - FirstHour]?.[picked.day];

  const weekdayNames = CalendarText.weekdays[workspace.weekStartsOn];
  const dayLabels = week.days.map(
    (day, index) => `${weekdayNames[index] ?? ""} ${day.day}`,
  );
  const hourLabel = (hour: number) =>
    time.timeFormat === "24h"
      ? `${pad(hour % 24)}:00`
      : `${hour % 12 || 12} ${hour % 24 < 12 ? "AM" : "PM"}`;
  const timeOf = (date: Date) => formatTime(date, tz, time.timeFormat);
  // "5 PM" on the hour, "5:30 PM" otherwise: short enough for a day cell.
  const shortTime = (date: Date) => {
    const wall = toWallTime(date, tz);
    return wall.minute === 0 ? hourLabel(wall.hour) : timeOf(date);
  };
  const teamCity = zoneCity(workspace.timeZone);
  const zoneLine =
    view.prefs.zone === "team"
      ? Team.zoneLine.team(teamCity)
      : Team.zoneLine.mine(
          zoneCity(ownZone),
          Team.apart(hoursApart(ownZone, workspace.timeZone, now), teamCity),
        );

  const byId = new Map(people.map((person) => [person.id, person]));
  const panelPerson = (id: string): PanelPerson => {
    const person = byId.get(id);
    const block =
      cell && person
        ? person.time.busy.find(
            (entry) =>
              entry.title &&
              entry.startsAt < cell.end &&
              entry.endsAt > cell.start,
          )
        : undefined;
    return { id, name: person?.name ?? "", note: block?.title };
  };
  const planHref = (() => {
    if (!cell) return null;
    const wall = toWallTime(cell.start, workspace.timeZone);
    const date = dayKey(cell.start, workspace.timeZone);
    return `${RoutePaths.newEvent}?date=${date}&time=${pad(wall.hour)}:${pad(wall.minute)}${groupId ? `&group=${groupId}` : ""}`;
  })();
  const best = everyoneFree(rows, now)
    .slice(0, 6)
    .map((slot) => {
      const day = week.days.findIndex(
        (entry) => slot.start >= entry.start && slot.start < entry.end,
      );
      return {
        key: String(slot.start.getTime()),
        label: `${weekdayNames[day] ?? ""} ${shortTime(slot.start)} – ${shortTime(slot.end)}`,
        onPick: () =>
          setPickedAt({ day, hour: toWallTime(slot.start, tz).hour }),
      };
    });

  const dayOf = (person: TeamRowPerson, dayIndex: number): DayCell => {
    const day = week.days[dayIndex];
    if (!person.filled)
      return {
        kind: "unknown",
        text: Team.notFilled,
        label: Team.dayFree(
          person.name,
          dayLabels[dayIndex],
          Team.notFilledLabel,
        ),
      };
    const free = freeStretches(person.time, day, tz);
    const spans = free.map(
      (stretch) => `${shortTime(stretch.start)} – ${shortTime(stretch.end)}`,
    );
    const text =
      spans.length === 0
        ? Team.unavailable
        : spans.length === 1
          ? spans[0]
          : `${spans[0]} ${Team.more(spans.length - 1)}`;
    return {
      kind: free.length === 0 ? "unavailable" : "free",
      text,
      label: Team.dayFree(
        person.name,
        dayLabels[dayIndex],
        spans.length === 0 ? Team.unavailable : spans.join(", "),
      ),
    };
  };

  function setParam(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  }

  function show(ids: readonly string[], on: boolean) {
    const next = new Set(view.prefs.hidden);
    for (const id of ids) {
      if (on) next.delete(id);
      else next.add(id);
    }
    view.change({ hidden: [...next] });
  }

  const canTag = access.can("tagPeople") || access.can("manageMembers");

  const peopleList = (
    <TeamPeopleList
      sections={sections}
      tags={tags.items}
      hidden={hidden}
      onShow={show}
      onReorder={(key, ids) =>
        view.change({ order: reorderSection(sections, key, ids) })
      }
      comparing={Team.comparing(compared.length, people.length)}
      stateOf={
        seeBy === "hours"
          ? (person) => (cell?.free.includes(person.id) ? "free" : "busy")
          : undefined
      }
      stateHead={
        seeBy === "hours"
          ? `${weekdayNames[picked.day] ?? ""} ${hourLabel(picked.hour)}`
          : undefined
      }
      days={seeBy === "people" ? dayLabels : undefined}
      dayOf={seeBy === "people" ? dayOf : undefined}
      pickedDay={picked.day}
      onPickDay={(day) => setPickedAt({ day, hour: picked.hour })}
      canTag={canTag}
      isTagging={isTagging}
      onTagging={setIsTagging}
    />
  );

  return (
    <div className={styles.page}>
      <PageHeader
        title={ViewText.team}
        breadcrumbs={[
          { label: ViewText.calendar, to: RoutePaths.calendar },
          { label: ViewText.team },
        ]}
        description={[current?.group.name, formatWeek(week), zoneLine]
          .filter(Boolean)
          .join(" · ")}
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
              <Select
                label={ViewText.group}
                hideLabel
                options={sorted.map((item) => ({
                  value: item.group.id,
                  label: item.group.name,
                }))}
                value={groupId ?? ""}
                onChange={(event) => setParam({ group: event.target.value })}
                className={styles.picker}
              />
            </div>
            <div className={styles.switches}>
              <span className={styles.switchLabel}>{Team.seeBy}</span>
              <SegmentedControl
                label={Team.seeBy}
                options={[
                  { value: "hours", label: Team.views.hours },
                  { value: "people", label: Team.views.people },
                ]}
                value={seeBy}
                onChange={(value) =>
                  setParam({ by: value === "people" ? "people" : null })
                }
              />
              <span className={styles.switchLabel}>{Team.showTimesIn}</span>
              <ZoneSwitch
                value={view.prefs.zone}
                onChange={(zone) => view.change({ zone })}
                teamZone={workspace.timeZone}
                ownZone={ownZone}
              />
            </div>
          </div>

          <div className={styles.teamLayout} data-by={seeBy}>
            {seeBy === "people" ? (
              <TourTarget id="teamGrid">{peopleList}</TourTarget>
            ) : (
              peopleList
            )}
            {seeBy === "hours" ? (
              <TeamHourGrid
                rows={rows}
                days={dayLabels}
                hourLabel={hourLabel}
                picked={picked}
                onPick={(day, hour) => setPickedAt({ day, hour })}
                todayIndex={todayIndex}
              />
            ) : null}
            <HourPanel
              title={Team.picked(
                dayLabels[picked.day] ?? "",
                hourLabel(picked.hour),
              )}
              subtitle={
                seeBy === "people"
                  ? `${Team.pickedSub(
                      Team.zoneShort[view.prefs.zone],
                      hourLabel(picked.hour),
                      hourLabel(picked.hour + 1),
                    )} · ${Team.pickedSubPeople}`
                  : Team.pickedSub(
                      Team.zoneShort[view.prefs.zone],
                      hourLabel(picked.hour),
                      hourLabel(picked.hour + 1),
                    )
              }
              free={(cell?.free ?? []).map(panelPerson)}
              busy={(cell?.busy ?? []).map(panelPerson)}
              unknown={shown
                .filter((person) => !person.filled)
                .map((person) => ({ id: person.id, name: person.name }))}
              planHref={planHref}
              best={best}
            />
          </div>
          {shown.length === 0 && people.length > 0 ? (
            <p className={styles.muted}>{Team.noneShown}</p>
          ) : null}
          {seeBy === "people" ? (
            <p className={styles.muted}>{Team.peopleNote}</p>
          ) : null}
        </>
      )}
    </div>
  );
}

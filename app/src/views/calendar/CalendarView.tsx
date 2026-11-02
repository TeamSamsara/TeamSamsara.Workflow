// File : /TeamSamsara.Workflow/app/src/views/calendar/CalendarView.tsx
// Version : 1.2.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : The calendar: a month, a week (8 AM to midnight) or a list, of the
// calendar picked: My calendar (what involves me), my work groups, one group,
// or everything for View all. The view, the dates and the calendar are kept in
// the address so a link opens the same view, and the browser remembers the
// last view and calendar. Planners add events from here and change them from
// each event's ⋯ menu; opening it also makes the coming weeks' events of each
// repeat. New task makes a one-off task.

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePermissions } from "@/core/access";
import { DataErrorText, isCurrentMember } from "@/core/data";
import { useSession } from "@/core/session";
import { useWorkspaceRecord } from "@/core/workspace";
import {
  CalendarList,
  CalendarMonth,
  CalendarText as Text,
  CalendarWeek,
  EventActions,
  EventItem,
  involves,
  occurrenceStart,
  readScope,
  scopeValue,
  SkippedItem,
  TaskItem,
  useAudienceOptions,
  useEventProgress,
  useEventsInRange,
  useRepeats,
  useRepeatTopUp,
  useSeesAllEvents,
  useSeesAllTasks,
  useStandaloneTasksInRange,
  type CalendarScope,
  type WeekEntry,
} from "@/features/events";
import { useMembers } from "@/features/members";
import { usePlatforms } from "@/features/platforms";
import {
  startingStatus,
  useEventTypes,
  useStatuses,
  useTags,
} from "@/features/task-setup";
import {
  NewTaskDialog,
  useOpenTasksFor,
  type TaskRecord,
} from "@/features/tasks";
import { useWorkGroups } from "@/features/work-groups";
import { formatClockTime, useWorkflows } from "@/features/workflows";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { IconButton } from "@/shared/components/Button/IconButton";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { Select } from "@/shared/components/Fields/Select/Select";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { useToast } from "@/shared/components/Toast/useToast";
import {
  eventPath,
  newEventPath,
  taskPath,
} from "@/shared/constants/routePaths";
import { useNow } from "@/shared/hooks/useNow";
import { dayKey, formatDate, formatTime } from "@/shared/time/dates";
import {
  addMonths,
  dayKeyToDate,
  formatMonth,
  monthGrid,
  monthKey,
  parseMonthKey,
} from "@/shared/time/monthGrid";
import {
  addDayKeys,
  formatWeek,
  parseDayKey,
  weekOf,
} from "@/shared/time/weekGrid";
import { toWallTime } from "@/shared/time/zonedTime";
import { CalendarViewText } from "./calendarViewContent";
import styles from "./CalendarView.module.css";

const Views = ["month", "week", "list"] as const;
type View = (typeof Views)[number];

/** What the browser remembers between visits. */
const remembered = {
  view: "workflow.calendar.view",
  cal: "workflow.calendar.cal",
} as const;

function recall(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function remember(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private windows can refuse; the address still holds it.
  }
}

/** Something to draw on the calendar, with when it starts and ends. */
interface Entry {
  id: string;
  start: Date;
  end: Date;
  render: (layout: CSSProperties | null, compact?: boolean) => ReactNode;
}

export function CalendarView() {
  const workspace = useWorkspaceRecord();
  const access = usePermissions();
  const session = useSession();
  const member = session.status === "active" ? session.member : null;
  const statuses = useStatuses();
  const eventTypes = useEventTypes();
  const groups = useWorkGroups();
  const members = useMembers();
  const tags = useTags();
  const platforms = usePlatforms();
  const people = useAudienceOptions();
  const seesAllTasks = useSeesAllTasks();
  const seesAllEvents = useSeesAllEvents();
  const workflows = useWorkflows();
  const toast = useToast();
  const navigate = useNavigate();
  const now = useNow();
  const [params, setParams] = useSearchParams();
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const tz = workspace.timeZone;
  const today = dayKey(now, tz);
  const viewer = useMemo(
    () =>
      member ? { id: member.id, workGroupIds: member.workGroupIds } : null,
    [member],
  );
  const repeats = useRepeats(viewer);

  // #region What's shown
  const asked = params.get("view") ?? recall(remembered.view);
  const view: View = Views.includes(asked as View) ? (asked as View) : "month";
  const scope: CalendarScope = readScope(
    params.get("cal") ?? params.get("group") ?? recall(remembered.cal),
    viewer,
    seesAllEvents,
  );
  useEffect(() => {
    remember(remembered.view, view);
    remember(remembered.cal, scopeValue(scope));
  }, [view, scope]);

  const todayWall = toWallTime(now, tz);
  const shownMonth = parseMonthKey(params.get("month")) ?? {
    year: todayWall.year,
    month: todayWall.month,
  };
  const grid = useMemo(
    () =>
      monthGrid(
        shownMonth.year,
        shownMonth.month,
        workspace.weekStartsOn,
        tz,
        now,
      ),
    [shownMonth.year, shownMonth.month, workspace.weekStartsOn, tz, now],
  );
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
  const range = view === "week" ? week : grid;
  // #endregion

  // #region Data
  useRepeatTopUp({
    repeats,
    workflows: workflows.items,
    workflowsReady: workflows.status === "ready",
    formats: {
      timeZone: tz,
      clock: workspace.timeFormat,
      dateFormat: workspace.dateFormat,
    },
    startingStatusId: startingStatus(statuses.items)?.id ?? null,
    memberId: member?.id ?? null,
    today,
  });
  const events = useEventsInRange(range.start, range.end, scope, viewer);
  const progress = useEventProgress(events.items.map((event) => event.id));
  const allTasks = useStandaloneTasksInRange(range.start, range.end);
  const myTasks = useOpenTasksFor(
    member?.id ?? null,
    member?.workGroupIds ?? [],
  );
  // #endregion

  function setParam(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    next.delete("group");
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  }

  const canPlan = access.can("planEvents");
  // Worked out on every render; the React compiler keeps it cheap.
  const entries = (() => {
    const list: Entry[] = [];
    const repeatOf = new Map(repeats.map((repeat) => [repeat.id, repeat]));
    const timeOf = (date: Date) => formatTime(date, tz, workspace.timeFormat);
    const span = (start: Date, end: Date) =>
      `${timeOf(start)} – ${timeOf(end)}`;

    for (const event of events.items) {
      const type = eventTypes.items.find(
        (entry) => entry.id === event.eventTypeId,
      );
      const repeat = event.repeatId
        ? (repeatOf.get(event.repeatId) ?? null)
        : null;
      const isMine = Boolean(member && event.memberIds.includes(member.id));
      list.push({
        id: event.id,
        start: event.startsAt,
        end: event.endsAt,
        render: (layout, compact) => (
          <EventItem
            key={event.id}
            compact={compact}
            event={event}
            color={type?.color ?? null}
            time={
              layout
                ? span(event.startsAt, event.endsAt)
                : timeOf(event.startsAt)
            }
            progress={progress.get(event.id)}
            href={eventPath(event.id)}
            isRepeat={event.repeatId !== null}
            isPast={event.endsAt.getTime() < now.getTime()}
            isMine={isMine}
            layout={layout}
            actions={
              canPlan ? (
                <EventActions event={event} repeat={repeat} look="item" />
              ) : null
            }
          />
        ),
      });
    }

    // One-off tasks for everything or a group; my open tasks on my calendars.
    const tasks: TaskRecord[] =
      scope.kind === "all"
        ? allTasks.items
        : scope.kind === "group"
          ? allTasks.items.filter((task) => task.workGroupId === scope.groupId)
          : myTasks.items.filter(
              (task) =>
                task.dueAt !== null &&
                task.dueAt >= range.start &&
                task.dueAt < range.end &&
                (scope.kind === "mine" || task.workGroupId !== null),
            );
    for (const task of tasks) {
      if (!task.dueAt) continue;
      const dueAt = task.dueAt;
      list.push({
        id: `task:${task.id}`,
        start: dueAt,
        end: dueAt,
        render: (layout) => (
          <TaskItem
            key={task.id}
            task={task}
            statuses={statuses.items}
            time={timeOf(dueAt)}
            isLate={!task.doneAt && dueAt.getTime() < now.getTime()}
            href={taskPath(task.id)}
            layout={layout}
          />
        ),
      });
    }

    // Dates a repeat skips, so it's clear they were left out on purpose.
    for (const repeat of repeats) {
      const inScope =
        scope.kind === "all" ||
        repeat.everyone ||
        (scope.kind === "group"
          ? repeat.groupIds.includes(scope.groupId)
          : scope.kind === "groups"
            ? repeat.groupIds.some((id) => viewer?.workGroupIds.includes(id))
            : involves(repeat, viewer) || repeat.createdBy === viewer?.id);
      if (!inScope) continue;
      for (const date of repeat.skipDates) {
        const start = occurrenceStart(date, repeat.time, tz);
        if (start < range.start || start >= range.end) continue;
        const end = new Date(start.getTime() + repeat.minutes * 60_000);
        list.push({
          id: `skip:${repeat.id}_${date}`,
          start,
          end,
          render: (layout) => (
            <SkippedItem
              key={`${repeat.id}_${date}`}
              title={repeat.title}
              time={timeOf(start)}
              layout={layout}
            />
          ),
        });
      }
    }
    return list.sort((a, b) => a.start.getTime() - b.start.getTime());
  })();

  const byStartDay = new Map<string, ReactNode[]>();
  for (const entry of entries) {
    const key = dayKey(entry.start, tz);
    byStartDay.set(key, [...(byStartDay.get(key) ?? []), entry.render(null)]);
  }

  const weekEntriesFor = (key: string): WeekEntry[] => {
    const day = week.days.find((entry) => entry.key === key);
    if (!day) return [];
    return entries.filter(
      (entry) =>
        entry.start < day.end &&
        (entry.end > day.start ||
          (entry.end.getTime() === entry.start.getTime() &&
            entry.start >= day.start)),
    );
  };

  const itemsFor = (key: string) => byStartDay.get(key) ?? [];
  const dayLabel = (key: string) =>
    formatDate(dayKeyToDate(key), "UTC", workspace.dateFormat);
  const previous = addMonths(shownMonth.year, shownMonth.month, -1);
  const next = addMonths(shownMonth.year, shownMonth.month, 1);

  // #region The calendar picker
  const myGroupIds = new Set(viewer?.workGroupIds ?? []);
  const pickerOptions = [
    { value: "mine", label: Text.mine },
    ...((viewer?.workGroupIds.length ?? 0) > 1
      ? [{ value: "groups", label: Text.allMyGroups, group: Text.myGroups }]
      : []),
    ...people.groups
      .filter((group) => myGroupIds.has(group.id))
      .map((group) => ({
        value: group.id,
        label: group.name,
        group: Text.myGroups,
      })),
    ...(seesAllEvents
      ? [
          ...people.groups
            .filter((group) => !myGroupIds.has(group.id))
            .map((group) => ({
              value: group.id,
              label: group.name,
              group: Text.otherGroups,
            })),
          { value: "all", label: Text.everything, group: Text.everythingGroup },
        ]
      : []),
  ];
  // #endregion

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>
            {view === "week"
              ? formatWeek(week)
              : formatMonth(shownMonth.year, shownMonth.month)}
          </h1>
          <IconButton
            icon="previous"
            label={view === "week" ? Text.previousWeek : Text.previous}
            variant="ghost"
            onClick={() =>
              view === "week"
                ? setParam({ week: addDayKeys(week.key, -7) })
                : setParam({ month: monthKey(previous.year, previous.month) })
            }
          />
          <IconButton
            icon="next"
            label={view === "week" ? Text.nextWeek : Text.next}
            variant="ghost"
            onClick={() =>
              view === "week"
                ? setParam({ week: addDayKeys(week.key, 7) })
                : setParam({ month: monthKey(next.year, next.month) })
            }
          />
          <Button
            variant="ghost"
            size="small"
            onClick={() => setParam({ month: null, week: null })}
          >
            {Text.today}
          </Button>
        </div>
        <div className={styles.toolbar}>
          <Select
            label={Text.calendarLabel}
            options={pickerOptions}
            value={scopeValue(scope)}
            onChange={(event) => setParam({ cal: event.target.value })}
            className={styles.picker}
          />
          <SegmentedControl
            label={Text.viewLabel}
            options={Views.map((value) => ({
              value,
              label: Text.views[value],
            }))}
            value={view}
            onChange={(value) => setParam({ view: value })}
          />
          <span className={styles.actions}>
            {access.can("createStandaloneTasks") ? (
              <Button iconStart="add" onClick={() => setIsCreatingTask(true)}>
                {Text.newTask}
              </Button>
            ) : null}
            {canPlan ? (
              <LinkButton to={newEventPath()} variant="primary" iconStart="add">
                {Text.newEvent}
              </LinkButton>
            ) : null}
          </span>
        </div>
      </header>

      {events.status === "error" ? (
        <Banner tone="error">{DataErrorText[events.error ?? "unknown"]}</Banner>
      ) : null}

      {events.status === "loading" ? (
        <div className={styles.loading}>
          <Spinner label={Text.loading} />
        </div>
      ) : view === "month" ? (
        <div className={styles.scroll}>
          <CalendarMonth
            grid={grid}
            weekStartsOn={workspace.weekStartsOn}
            itemsFor={itemsFor}
            addHref={canPlan ? newEventPath : undefined}
            dayLabel={dayLabel}
          />
        </div>
      ) : view === "week" ? (
        <div className={styles.scroll}>
          <CalendarWeek
            days={week.days}
            entriesFor={weekEntriesFor}
            now={now}
            addHref={canPlan ? newEventPath : undefined}
            dayLabel={dayLabel}
            weekdayNames={Text.weekdays[workspace.weekStartsOn]}
            hourLabel={(hour) =>
              formatClockTime(
                `${String(hour).padStart(2, "0")}:00`,
                workspace.timeFormat,
              ).replace(":00", "")
            }
          />
        </div>
      ) : (
        <CalendarList
          dayKeys={grid.weeks
            .flat()
            .filter((day) => day.inMonth)
            .map((day) => day.key)}
          itemsFor={itemsFor}
          dayLabel={dayLabel}
          todayKey={today}
        />
      )}
      <p className={styles.legend}>
        {scope.kind === "mine"
          ? CalendarViewText.mineLegend
          : !seesAllTasks && scope.kind === "group"
            ? CalendarViewText.groupLegend
            : Text.legend}
      </p>

      {isCreatingTask && member ? (
        <NewTaskDialog
          options={{
            groups: groups.items.map((item) => item.group),
            members: members.records.filter(isCurrentMember),
            tags: tags.items,
            platforms: platforms.settings,
          }}
          timeZone={tz}
          startingStatusId={startingStatus(statuses.items)?.id ?? null}
          createdBy={member.id}
          start={{ memberId: member.id }}
          onClose={() => setIsCreatingTask(false)}
          onCreated={(taskId, title) => {
            toast.show({
              tone: "success",
              title: CalendarViewText.taskCreated(title),
            });
            navigate(taskPath(taskId));
          }}
        />
      ) : null}
    </div>
  );
}

// File : /TeamSamsara.Workflow/app/src/views/calendar/CalendarView.tsx
// Version : 1.0.0
// Latest commit: feature/calendar-events
// Author : Gerrah
// Purpose : The calendar: a month of events (and one-off tasks) as a grid or a
// list, with the month, view and work group kept in the address so a link
// opens the same view. Planners add events from here; New task makes a
// one-off task.

import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePermissions } from "@/core/access";
import { DataErrorText, isCurrentMember } from "@/core/data";
import { useSession } from "@/core/session";
import { useWorkspaceRecord } from "@/core/workspace";
import {
  CalendarList,
  CalendarMonth,
  CalendarText as Text,
  EventItem,
  TaskItem,
  useEventProgress,
  useEventsInRange,
  useSeesAllTasks,
  useStandaloneTasksInRange,
} from "@/features/events";
import { useMembers } from "@/features/members";
import { usePlatforms } from "@/features/platforms";
import {
  startingStatus,
  useEventTypes,
  useStatuses,
  useTags,
} from "@/features/task-setup";
import { NewTaskDialog } from "@/features/tasks";
import { useWorkGroups } from "@/features/work-groups";
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
import { toWallTime } from "@/shared/time/zonedTime";
import { CalendarViewText } from "./calendarViewContent";
import styles from "./CalendarView.module.css";

type View = "month" | "list";

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
  const seesAll = useSeesAllTasks();
  const toast = useToast();
  const navigate = useNavigate();
  const now = useNow();
  const [params, setParams] = useSearchParams();
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const tz = workspace.timeZone;
  const todayWall = toWallTime(now, tz);
  const shown = parseMonthKey(params.get("month")) ?? {
    year: todayWall.year,
    month: todayWall.month,
  };
  const view: View = params.get("view") === "list" ? "list" : "month";
  const groupFilter = params.get("group") ?? "";
  const grid = useMemo(
    () => monthGrid(shown.year, shown.month, workspace.weekStartsOn, tz, now),
    [shown.year, shown.month, workspace.weekStartsOn, tz, now],
  );

  const events = useEventsInRange(grid.start, grid.end);
  const progress = useEventProgress(events.items.map((event) => event.id));
  const tasks = useStandaloneTasksInRange(grid.start, grid.end);

  function setParam(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  }

  const itemsByDay = useMemo(() => {
    const byDay = new Map<string, { at: number; node: ReactNode }[]>();
    const add = (key: string, at: number, node: ReactNode) =>
      byDay.set(key, [...(byDay.get(key) ?? []), { at, node }]);
    for (const event of events.items) {
      const eventProgress = progress.get(event.id);
      if (
        groupFilter &&
        eventProgress &&
        !eventProgress.groupIds.has(groupFilter)
      )
        continue;
      const type = eventTypes.items.find(
        (entry) => entry.id === event.eventTypeId,
      );
      add(
        dayKey(event.startsAt, tz),
        event.startsAt.getTime(),
        <EventItem
          key={event.id}
          event={event}
          color={type?.color ?? null}
          time={formatTime(event.startsAt, tz, workspace.timeFormat)}
          progress={eventProgress}
          href={eventPath(event.id)}
        />,
      );
    }
    for (const task of tasks.items) {
      if (!task.dueAt) continue;
      if (groupFilter && task.workGroupId !== groupFilter) continue;
      add(
        dayKey(task.dueAt, tz),
        task.dueAt.getTime(),
        <TaskItem
          key={task.id}
          task={task}
          statuses={statuses.items}
          time={formatTime(task.dueAt, tz, workspace.timeFormat)}
          isLate={!task.doneAt && task.dueAt.getTime() < now.getTime()}
          href={taskPath(task.id)}
        />,
      );
    }
    return new Map(
      [...byDay].map(([key, items]) => [
        key,
        items.sort((a, b) => a.at - b.at).map((item) => item.node),
      ]),
    );
  }, [
    events.items,
    tasks.items,
    progress,
    groupFilter,
    eventTypes.items,
    statuses.items,
    tz,
    workspace.timeFormat,
    now,
  ]);

  const itemsFor = (key: string) => itemsByDay.get(key) ?? [];
  const dayLabel = (key: string) =>
    formatDate(dayKeyToDate(key), "UTC", workspace.dateFormat);
  const canPlan = access.can("planEvents");
  const previous = addMonths(shown.year, shown.month, -1);
  const next = addMonths(shown.year, shown.month, 1);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>
            {formatMonth(shown.year, shown.month)}
          </h1>
          <IconButton
            icon="previous"
            label={Text.previous}
            variant="ghost"
            onClick={() =>
              setParam({ month: monthKey(previous.year, previous.month) })
            }
          />
          <IconButton
            icon="next"
            label={Text.next}
            variant="ghost"
            onClick={() => setParam({ month: monthKey(next.year, next.month) })}
          />
          <Button
            variant="ghost"
            size="small"
            onClick={() => setParam({ month: null })}
          >
            {Text.today}
          </Button>
        </div>
        <div className={styles.toolbar}>
          <SegmentedControl
            label={Text.viewLabel}
            options={(["month", "list"] as const).map((value) => ({
              value,
              label: Text.views[value],
            }))}
            value={view}
            onChange={(value) =>
              setParam({ view: value === "month" ? null : value })
            }
          />
          <Select
            label={Text.groupLabel}
            hideLabel
            options={[
              { value: "", label: Text.allGroups },
              ...groups.items.map((item) => ({
                value: item.group.id,
                label: item.group.name,
              })),
            ]}
            value={groupFilter}
            onChange={(event) =>
              setParam({ group: event.target.value || null })
            }
            className={styles.groupFilter}
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
      {!seesAll ? (
        <Banner tone="info">{CalendarViewText.limited}</Banner>
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
      ) : (
        <CalendarList
          dayKeys={grid.weeks
            .flat()
            .filter((day) => day.inMonth)
            .map((day) => day.key)}
          itemsFor={itemsFor}
          dayLabel={dayLabel}
          todayKey={dayKey(now, tz)}
        />
      )}
      <p className={styles.legend}>{Text.legend}</p>

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

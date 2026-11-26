// File : /TeamSamsara.Workflow/app/src/views/tasks/MyTasksView.tsx
// Version : 1.5.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : My tasks. Whose: Mine (the default), My groups, or Pick groups,
// remembered in the browser. How much: Focus (late, today and the next 7
// days, with how many more are coming up), Planning (everything still to do)
// or Done this week (by day, with who did and approved it). Above the list,
// for each of my groups that hands out its tasks, what's waiting for someone,
// with Claim. Each task links to
// its event. Beside it: what's waiting for approval (for approvers) and the
// Done this week card. New task makes a one-off task.

import { useMutation } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { decide } from "@engine/access/index";
import { useActor, usePermissions } from "@/core/access";
import { DataErrorText, dataErrorMessage, isCurrentMember } from "@/core/data";
import { useSession } from "@/core/session";
import { useDisplayTime, useWorkspaceRecord } from "@/core/workspace";
import {
  useEventLabels,
  useSeesAllTasks,
  useTaskOrder,
} from "@/features/events";
import { memberName, useMembers } from "@/features/members";
import { usePlatforms } from "@/features/platforms";
import { startingStatus, useStatuses, useTags } from "@/features/task-setup";
import {
  claimTask,
  doneByDay,
  DoneThisWeekCard,
  DueGroups,
  DueGroupText,
  FocusGroups,
  formatDue,
  groupByDue,
  inScope,
  NewTaskDialog,
  readScope,
  scopeGroupIds,
  startOfWeek,
  TaskGroupCard,
  TaskScopes,
  useDoneTasksSince,
  useOpenTasksFor,
  useTasksInStatuses,
  useWaitingTasks,
  weekCounts,
  type TaskListContext,
  type TaskRecord,
  type TaskScope,
} from "@/features/tasks";
import { useWorkGroups } from "@/features/work-groups";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { Tab } from "@/shared/components/Tabs/Tab";
import { TabPanel } from "@/shared/components/Tabs/TabPanel";
import { TabList } from "@/shared/components/Tabs/TabList";
import { Tabs } from "@/shared/components/Tabs/Tabs";
import { useToast } from "@/shared/components/Toast/useToast";
import { eventPath, taskPath } from "@/shared/constants/routePaths";
import { useNow } from "@/shared/hooks/useNow";
import { Icon } from "@/shared/icons/Icon";
import { dayKey, formatDate } from "@/shared/time/dates";
import { MyTasksViewText as Text } from "./myTasksViewContent";
import styles from "./MyTasksView.module.css";

const Views = ["focus", "planning", "done"] as const;
type View = (typeof Views)[number];

const remembered = {
  scope: "workflow.myTasks.scope",
  picked: "workflow.myTasks.picked",
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
    // Private windows can refuse; it just starts on Mine next time.
  }
}

const dayMs = 24 * 60 * 60 * 1000;

export function MyTasksView() {
  const session = useSession();
  const member = session.status === "active" ? session.member : null;
  const access = usePermissions();
  const workspace = useWorkspaceRecord();
  const time = useDisplayTime();
  const statuses = useStatuses();
  const groups = useWorkGroups();
  const members = useMembers();
  const tags = useTags();
  const platforms = usePlatforms();
  const seesAllTasks = useSeesAllTasks();
  const toast = useToast();
  const navigate = useNavigate();
  const now = useNow();
  const [params, setParams] = useSearchParams();
  const [scope, setScopeState] = useState<TaskScope>(() =>
    readScope(recall(remembered.scope)),
  );
  const [pickedIds, setPickedIds] = useState<string[]>(() =>
    (recall(remembered.picked) ?? "").split(",").filter(Boolean),
  );
  const [isCreating, setIsCreating] = useState(false);

  const asked = params.get("view");
  const view: View = Views.includes(asked as View) ? (asked as View) : "focus";
  function setView(next: string) {
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        if (next === "focus") copy.delete("view");
        else copy.set("view", next);
        return copy;
      },
      { replace: true },
    );
  }
  function setScope(next: TaskScope) {
    setScopeState(next);
    remember(remembered.scope, next);
  }
  function togglePicked(groupId: string) {
    const next = pickedIds.includes(groupId)
      ? pickedIds.filter((id) => id !== groupId)
      : [...pickedIds, groupId];
    setPickedIds(next);
    remember(remembered.picked, next.join(","));
  }

  const allGroups = groups.items.map((item) => item.group);
  const myGroupIds = member?.workGroupIds ?? [];
  // Others' groups can be picked only by people who can read every task.
  const pickable = allGroups.filter(
    (group) => seesAllTasks || myGroupIds.includes(group.id),
  );
  const picked = pickedIds.filter((id) =>
    pickable.some((group) => group.id === id),
  );
  const groupIds = scopeGroupIds(scope, myGroupIds, picked);
  const me = member?.id ?? "";
  const fits = (task: TaskRecord) =>
    inScope(task, scope, me, myGroupIds, picked);

  const open = useOpenTasksFor(member?.id ?? null, groupIds);
  const today = dayKey(now, time.timeZone);
  // Recomputed once a day, so the queries stay the same all week.
  const weekStart = useMemo(
    () => startOfWeek(now, time.timeZone, workspace.weekStartsOn),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, time.timeZone, workspace.weekStartsOn],
  );
  const done = useDoneTasksSince(member?.id ?? null, groupIds, weekStart);

  // Approvers see what's waiting anywhere; leads, what's waiting in their
  // groups. Either way only what they may approve: never their own work,
  // and only from people at or below them.
  const actor = useActor();
  const isApprover = access.can("approveTasks");
  const canApprove = isApprover || (member?.leadOf.length ?? 0) > 0;
  const awaitingStatusIds = useMemo(
    () =>
      statuses.status === "ready"
        ? statuses.items
            .filter((status) => status.category === "awaitingApproval")
            .map((status) => status.id)
        : [],
    [statuses.status, statuses.items],
  );
  const queue = useTasksInStatuses(isApprover ? awaitingStatusIds : null);

  const approvals = useMemo(() => {
    if (!actor) return [];
    const rankOf = (id: string | null) =>
      id ? (members.records.find((entry) => entry.id === id)?.rank ?? 0) : null;
    const seen = new Set<string>();
    return [...queue.items, ...open.items]
      .filter((task) => awaitingStatusIds.includes(task.statusId))
      .filter((task) => !seen.has(task.id) && seen.add(task.id))
      .filter(
        (task) =>
          decide(actor, {
            action: "task.approve",
            task: {
              groupId: task.workGroupId,
              memberId: task.memberId,
              createdBy: task.createdBy,
              event: null,
              sentForReviewBy: task.sentForReviewBy,
              awaitingReview: true,
              ranks: {
                assignee: rankOf(task.memberId),
                doer: rankOf(task.sentForReviewBy ?? task.memberId),
                maker: rankOf(task.createdBy) ?? 0,
              },
            },
          }).ok,
      );
  }, [actor, queue.items, open.items, members.records, awaitingStatusIds]);

  // Groups I'm in that hand out their tasks: what's waiting there shows on
  // its own, with Claim, whatever the scope.
  const handingOut = allGroups.filter(
    (group) => group.assign.on && myGroupIds.includes(group.id),
  );
  const waiting = useWaitingTasks(handingOut.map((group) => group.id));
  const waitingIds = new Set(waiting.items.map((task) => task.id));
  const claim = useMutation({
    mutationFn: (task: TaskRecord) => claimTask(task.id, me),
    onSuccess: (_result, task) =>
      toast.show({ tone: "success", title: Text.claimed(task.title) }),
    onError: (error) =>
      toast.show({
        tone: "error",
        title: Text.claimFailed,
        detail: dataErrorMessage(error),
      }),
  });
  const canClaim = (task: TaskRecord) =>
    actor !== null &&
    decide(actor, {
      action: "task.claim",
      task: {
        groupId: task.workGroupId,
        memberId: task.memberId,
        createdBy: task.createdBy,
        event: null,
        sentForReviewBy: null,
        awaitingReview: false,
        ranks: { assignee: null, doer: null, maker: 0 },
      },
      // Claiming is their own choice, whether or not the group hands them tasks.
      takesTasks: true,
    }).ok;

  const openTasks = open.items.filter(
    (task) => fits(task) && !waitingIds.has(task.id),
  );
  const doneTasks = done.items.filter(fits);
  const shownTasks = view === "done" ? doneTasks : [...openTasks, ...approvals];
  const events = useEventLabels(shownTasks.map((task) => task.eventId));
  const workflowsOf = useCallback(
    (eventId: string) => events.get(eventId)?.workflowIds,
    [events],
  );
  const inOrder = useTaskOrder(workflowsOf);

  const nameOf = (id: string | null) => {
    const found = id
      ? members.records.find((entry) => entry.id === id)
      : undefined;
    return found ? memberName(found) : null;
  };
  const context: TaskListContext = {
    statuses: statuses.items,
    groups: allGroups,
    members: members.records,
    formatDue: (dueAt) =>
      formatDue(dueAt, time.timeZone, time.timeFormat, time.dateFormat, now),
    hrefFor: taskPath,
    now,
    eventOf: (task) => {
      const event = task.eventId ? events.get(task.eventId) : undefined;
      return event && task.eventId
        ? {
            label: `${event.title} · ${formatDate(event.startsAt, time.timeZone, time.dateFormat)}`,
            href: eventPath(task.eventId),
          }
        : null;
    },
    doneNote: (task) => {
      const doer = task.doneBy ?? task.sentForReviewBy;
      const approver = task.approvedBy;
      const parts = [
        doer && doer !== me ? Text.doneBy(nameOf(doer) ?? "someone") : null,
        approver && approver !== doer
          ? (doer && doer !== me ? Text.approvedBy : Text.approvedByStart)(
              nameOf(approver) ?? "someone",
            )
          : null,
      ].filter((part): part is string => part !== null);
      return parts.length > 0 ? parts.join(" · ") : null;
    },
  };

  const byDue = groupByDue(openTasks, now, time.timeZone);
  const grouped = Object.fromEntries(
    DueGroups.map((group) => [group, inOrder(byDue[group])]),
  ) as typeof byDue;
  const shownGroups = view === "focus" ? FocusGroups : DueGroups;
  const later = [...grouped.later, ...grouped.noDue];
  const laterEvents = new Set(
    later.flatMap((task) => (task.eventId ? [task.eventId] : [])),
  ).size;
  const days = doneByDay(doneTasks, weekStart, time.timeZone);
  const counts = weekCounts(doneTasks, weekStart, time.timeZone);
  const todayIndex = weekCounts(
    [{ doneAt: now }],
    weekStart,
    time.timeZone,
  ).indexOf(1);
  const dayTitle = (key: string, date: Date) =>
    key === today
      ? Text.today
      : key === dayKey(new Date(now.getTime() - dayMs), time.timeZone)
        ? Text.yesterday
        : formatDate(date, time.timeZone, time.dateFormat);

  const list = view === "done" ? done : open;
  const isEmpty =
    list.status === "ready" &&
    (view === "done"
      ? doneTasks.length === 0
      : view === "focus"
        ? shownGroups.every((group) => grouped[group].length === 0)
        : openTasks.length === 0);

  return (
    <Tabs value={view} onValueChange={setView}>
      <div className={styles.page}>
        <PageHeader
          title={Text.title}
          description={Text.description}
          actions={
            access.can("createStandaloneTasks") ? (
              <Button
                variant="primary"
                iconStart="add"
                onClick={() => setIsCreating(true)}
              >
                {Text.newTask}
              </Button>
            ) : null
          }
        />

        <div className={styles.toolbar}>
          <SegmentedControl
            label={Text.scopeLabel}
            options={TaskScopes.map((value) => ({
              value,
              label: Text.scopes[value],
            }))}
            value={scope}
            onChange={setScope}
          />
          {scope === "pick" ? (
            pickable.length > 0 ? (
              <div
                className={styles.picks}
                role="group"
                aria-label={Text.pickLabel}
              >
                {pickable.map((group) => {
                  const on = picked.includes(group.id);
                  return (
                    <button
                      key={group.id}
                      type="button"
                      className={styles.pick}
                      aria-pressed={on}
                      onClick={() => togglePicked(group.id)}
                    >
                      {on ? <Icon name="check" /> : null}
                      {group.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className={styles.muted}>{Text.noGroups}</span>
            )
          ) : null}
          <span className={styles.spacer} />
          <TabList label={Text.viewsLabel} className={styles.views}>
            {Views.map((value) => (
              <Tab key={value} value={value}>
                {Text.views[value]}
              </Tab>
            ))}
          </TabList>
        </div>

        <div className={styles.columns}>
          <div className={styles.main} data-tour="myTasks">
            <TabPanel value={view} className={styles.panel}>
              {scope === "pick" &&
              picked.length === 0 &&
              pickable.length > 0 ? (
                <p className={styles.muted}>{Text.pickNone}</p>
              ) : null}
              {view !== "done"
                ? handingOut.map((group) => {
                    const tasks = inOrder(
                      waiting.items.filter(
                        (task) => task.workGroupId === group.id,
                      ),
                    );
                    return tasks.length ? (
                      <TaskGroupCard
                        key={`waiting-${group.id}`}
                        title={Text.waiting(group.name)}
                        note={Text.waitingNote}
                        tasks={tasks}
                        context={context}
                        tone="waiting"
                        actionFor={(task) =>
                          canClaim(task) ? (
                            <Button
                              size="small"
                              variant="primary"
                              onClick={() => claim.mutate(task)}
                              disabled={claim.isPending}
                            >
                              {Text.claim}
                            </Button>
                          ) : null
                        }
                      />
                    ) : null;
                  })
                : null}
              {list.status === "loading" ? (
                <div className={styles.loading}>
                  <Spinner label={Text.loading} />
                </div>
              ) : list.status === "error" ? (
                <Banner tone="error">
                  {DataErrorText[list.error ?? "unknown"]}
                </Banner>
              ) : isEmpty ? (
                <section className={styles.empty}>
                  <span className={styles.emptyIcon} aria-hidden="true">
                    <Icon name={view === "done" ? "check" : "myTasks"} />
                  </span>
                  <h2 className={styles.emptyTitle}>
                    {view === "done"
                      ? Text.doneEmptyTitle
                      : waiting.items.length > 0
                        ? Text.claimEmptyTitle
                        : view === "focus"
                          ? Text.focusEmptyTitle
                          : Text.emptyTitle}
                  </h2>
                  <p className={styles.muted}>
                    {view === "done"
                      ? Text.doneEmptyBody
                      : waiting.items.length > 0
                        ? Text.claimEmptyBody
                        : view === "focus"
                          ? Text.focusEmptyBody
                          : Text.emptyBody}
                  </p>
                </section>
              ) : view === "done" ? (
                days.map((day) => (
                  <TaskGroupCard
                    key={day.key}
                    title={dayTitle(day.key, day.date)}
                    tasks={day.tasks}
                    context={context}
                  />
                ))
              ) : (
                shownGroups
                  .filter((group) => grouped[group].length > 0)
                  .map((group) => (
                    <TaskGroupCard
                      key={group}
                      title={DueGroupText[group]}
                      tasks={grouped[group]}
                      context={context}
                      tone={group === "late" ? "late" : "default"}
                    />
                  ))
              )}
              {view === "focus" &&
              list.status === "ready" &&
              later.length > 0 ? (
                <button
                  type="button"
                  className={styles.comingUp}
                  onClick={() => setView("planning")}
                >
                  <b>{Text.comingUp(later.length)}</b>
                  <span className={styles.muted}>
                    {Text.comingUpEvents(laterEvents)}
                  </span>
                  <Icon name="next" />
                </button>
              ) : null}
            </TabPanel>
          </div>

          <aside className={styles.side} data-tour="myTasksSide">
            {canApprove ? (
              approvals.length > 0 ? (
                <TaskGroupCard
                  title={Text.approvals}
                  tasks={inOrder(approvals)}
                  context={context}
                />
              ) : (
                <section className={styles.quiet}>
                  <h2 className={styles.quietTitle}>{Text.approvals}</h2>
                  <p className={styles.muted}>{Text.noApprovals}</p>
                </section>
              )
            ) : null}
            <DoneThisWeekCard
              counts={counts}
              dayLetters={Text.dayLetters[workspace.weekStartsOn]}
              todayIndex={todayIndex}
              onOpen={() => setView("done")}
            />
          </aside>
        </div>

        {isCreating && member ? (
          <NewTaskDialog
            options={{
              groups: allGroups,
              members: members.records.filter(isCurrentMember),
              tags: tags.items,
              platforms: platforms.settings,
            }}
            timeZone={workspace.timeZone}
            startingStatusId={startingStatus(statuses.items)?.id ?? null}
            createdBy={member.id}
            start={{ memberId: member.id }}
            onClose={() => setIsCreating(false)}
            onCreated={(taskId, title) => {
              toast.show({ tone: "success", title: Text.created(title) });
              navigate(taskPath(taskId));
            }}
          />
        ) : null}
      </div>
    </Tabs>
  );
}

// File : /TeamSamsara.Workflow/app/src/views/tasks/MyTasksView.tsx
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : My tasks: what's given to me (and my work groups) and still to do,
// grouped Late, Today, This week, Later and No due date; beside it, for
// approvers, what's waiting for approval. New task makes a one-off task.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/core/access";
import { DataErrorText, isCurrentMember } from "@/core/data";
import { useSession } from "@/core/session";
import { useWorkspaceRecord } from "@/core/workspace";
import { useMembers } from "@/features/members";
import { usePlatforms } from "@/features/platforms";
import { startingStatus, useStatuses, useTags } from "@/features/task-setup";
import {
  DueGroups,
  DueGroupText,
  formatDue,
  groupByDue,
  NewTaskDialog,
  TaskGroupCard,
  useOpenTasksFor,
  useTasksInStatuses,
  type TaskListContext,
} from "@/features/tasks";
import { useWorkGroups } from "@/features/work-groups";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { useToast } from "@/shared/components/Toast/useToast";
import { taskPath } from "@/shared/constants/routePaths";
import { useNow } from "@/shared/hooks/useNow";
import { Icon } from "@/shared/icons/Icon";
import { MyTasksViewText as Text } from "./myTasksViewContent";
import styles from "./MyTasksView.module.css";

type Scope = "all" | "mine";

export function MyTasksView() {
  const session = useSession();
  const member = session.status === "active" ? session.member : null;
  const access = usePermissions();
  const workspace = useWorkspaceRecord();
  const statuses = useStatuses();
  const groups = useWorkGroups();
  const members = useMembers();
  const tags = useTags();
  const platforms = usePlatforms();
  const toast = useToast();
  const navigate = useNavigate();
  const now = useNow();
  const [scope, setScope] = useState<Scope>("all");
  const [isCreating, setIsCreating] = useState(false);

  const canApprove = access.can("approveTasks");
  const myGroups = groups.items
    .map((item) => item.group)
    .filter((group) => member?.workGroupIds.includes(group.id));
  const open = useOpenTasksFor(
    member?.id ?? null,
    scope === "all" ? myGroups.map((group) => group.id) : [],
  );
  const awaitingIds =
    canApprove && statuses.status === "ready"
      ? statuses.items
          .filter((status) => status.category === "awaitingApproval")
          .map((status) => status.id)
      : null;
  const queue = useTasksInStatuses(awaitingIds);

  const context: TaskListContext = {
    statuses: statuses.items,
    groups: groups.items.map((item) => item.group),
    members: members.records,
    formatDue: (dueAt) =>
      formatDue(
        dueAt,
        workspace.timeZone,
        workspace.timeFormat,
        workspace.dateFormat,
        now,
      ),
    hrefFor: taskPath,
    now,
  };
  const grouped = groupByDue(
    open.items,
    now,
    workspace.timeZone,
    workspace.weekStartsOn,
  );
  const isEmpty = open.status === "ready" && open.items.length === 0;

  return (
    <div className={styles.page}>
      <PageHeader
        title={Text.title}
        description={Text.description(myGroups.map((group) => group.name))}
        actions={
          <>
            <SegmentedControl
              label={Text.scopeLabel}
              options={(["all", "mine"] as const).map((value) => ({
                value,
                label: Text.scopes[value],
              }))}
              value={scope}
              onChange={setScope}
            />
            {access.can("createStandaloneTasks") ? (
              <Button
                variant="primary"
                iconStart="add"
                onClick={() => setIsCreating(true)}
              >
                {Text.newTask}
              </Button>
            ) : null}
          </>
        }
      />

      <div className={styles.columns}>
        <div className={styles.main}>
          {open.status === "loading" ? (
            <div className={styles.loading}>
              <Spinner label={Text.loading} />
            </div>
          ) : open.status === "error" ? (
            <Banner tone="error">
              {DataErrorText[open.error ?? "unknown"]}
            </Banner>
          ) : isEmpty ? (
            <section className={styles.empty}>
              <span className={styles.emptyIcon} aria-hidden="true">
                <Icon name="myTasks" />
              </span>
              <h2 className={styles.emptyTitle}>{Text.emptyTitle}</h2>
              <p className={styles.muted}>{Text.emptyBody}</p>
            </section>
          ) : (
            DueGroups.filter((group) => grouped[group].length > 0).map(
              (group) => (
                <TaskGroupCard
                  key={group}
                  title={DueGroupText[group]}
                  tasks={grouped[group]}
                  context={context}
                  tone={group === "late" ? "late" : "default"}
                />
              ),
            )
          )}
        </div>

        {canApprove ? (
          <aside className={styles.side}>
            {queue.items.length > 0 ? (
              <TaskGroupCard
                title={Text.approvals}
                note={Text.approvalsNote}
                tasks={queue.items}
                context={context}
              />
            ) : (
              <section className={styles.quiet}>
                <h2 className={styles.quietTitle}>{Text.approvals}</h2>
                <p className={styles.muted}>{Text.noApprovals}</p>
              </section>
            )}
          </aside>
        ) : null}
      </div>

      {isCreating && member ? (
        <NewTaskDialog
          options={{
            groups: groups.items.map((item) => item.group),
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
  );
}

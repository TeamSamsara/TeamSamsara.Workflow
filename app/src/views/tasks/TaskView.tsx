// File : /TeamSamsara.Workflow/app/src/views/tasks/TaskView.tsx
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : A task's page: where it is (the status steps), how to do it, the
// post text to copy and the checklist to tick; beside them, the next step,
// approval and who it's given to. Edit opens the task's form in place.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useBlocker, useNavigate, useParams } from "react-router-dom";
import { dataErrorMessage, isCurrentMember } from "@/core/data";
import { useWorkspaceRecord } from "@/core/workspace";
import { memberName, useMembers } from "@/features/members";
import { usePlatforms } from "@/features/platforms";
import { StatusPill, useStatuses, useTags } from "@/features/task-setup";
import {
  ApprovalCard,
  AssignedCard,
  ChecklistCard,
  checkTaskDraft,
  deleteTask,
  draftFromTask,
  DueText,
  fieldsFromDraft,
  formatDue,
  HowToCard,
  NextStepCard,
  PostTextCard,
  saveTaskFields,
  statusOf,
  TaskForm,
  TaskProgress,
  useTask,
  useTaskAbilities,
  type TaskDraft,
  type TaskRecord,
} from "@/features/tasks";
import { useWorkGroups } from "@/features/work-groups";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Chip } from "@/shared/components/Chip/Chip";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { Modal } from "@/shared/components/Modal/Modal";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { useToast } from "@/shared/components/Toast/useToast";
import { RoutePaths } from "@/shared/constants/routePaths";
import { useNow } from "@/shared/hooks/useNow";
import { Icon } from "@/shared/icons/Icon";
import { TaskViewText as Text } from "./taskViewContent";
import styles from "./TaskView.module.css";

function TaskPage({ task }: { task: TaskRecord }) {
  const workspace = useWorkspaceRecord();
  const statuses = useStatuses();
  const groups = useWorkGroups();
  const members = useMembers();
  const tags = useTags();
  const platforms = usePlatforms();
  const abilities = useTaskAbilities(task);
  const toast = useToast();
  const navigate = useNavigate();
  const now = useNow();
  const [draft, setDraft] = useState<TaskDraft | null>(null);
  const [tried, setTried] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const save = useMutation({
    mutationFn: (next: TaskDraft) =>
      saveTaskFields(task.id, fieldsFromDraft(next, workspace.timeZone)),
    onSuccess: (_result, next) => {
      toast.show({ tone: "success", title: Text.saved(next.title.trim()) });
      setDraft(null);
      setTried(false);
    },
  });
  const remove = useMutation({
    mutationFn: () => deleteTask(task.id),
    onSuccess: () => {
      toast.show({ tone: "success", title: Text.deleted(task.title) });
      navigate(RoutePaths.myTasks, { replace: true });
    },
    onError: (error) =>
      toast.show({ tone: "error", title: dataErrorMessage(error) }),
  });
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      draft !== null &&
      !save.isPending &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  const when = (date: Date) =>
    formatDue(
      date,
      workspace.timeZone,
      workspace.timeFormat,
      workspace.dateFormat,
      now,
    );
  const status = statusOf(task, statuses.items);
  const group = groups.items.find(
    (item) => item.group.id === task.workGroupId,
  )?.group;
  const member = members.records.find((entry) => entry.id === task.memberId);
  const isLate =
    task.dueAt !== null && !task.doneAt && task.dueAt.getTime() < now.getTime();
  const taskTags = tags.items.filter((tag) => task.tagIds.includes(tag.id));
  const hasDetails =
    Boolean(task.notes) ||
    (task.links?.length ?? 0) > 0 ||
    (task.posts?.length ?? 0) > 0 ||
    (task.checklist?.length ?? 0) > 0;
  const formOptions = {
    groups: groups.items.map((item) => item.group),
    members: members.records.filter(isCurrentMember),
    tags: tags.items,
    platforms: platforms.settings,
  };

  const actions = draft ? (
    <>
      <Button
        variant="ghost"
        onClick={() => setDraft(null)}
        disabled={save.isPending}
      >
        {Text.cancel}
      </Button>
      <Button
        variant="primary"
        onClick={() => {
          setTried(true);
          if (!checkTaskDraft(draft)) save.mutate(draft);
        }}
        isLoading={save.isPending}
      >
        {Text.save}
      </Button>
    </>
  ) : (
    <>
      {abilities.canDelete ? (
        <Button
          variant="ghost"
          iconStart="trash"
          onClick={() => setIsConfirmingDelete(true)}
        >
          {Text.delete}
        </Button>
      ) : null}
      {abilities.canEdit ? (
        <Button
          iconStart="edit"
          onClick={() => setDraft(draftFromTask(task, workspace.timeZone))}
        >
          {Text.edit}
        </Button>
      ) : null}
    </>
  );

  return (
    <>
      <PageHeader
        title={task.title}
        breadcrumbs={[
          { label: Text.myTasks, to: RoutePaths.myTasks },
          { label: task.title },
        ]}
        description={
          <span className={styles.meta}>
            {status ? <StatusPill status={status} /> : null}
            {group ? <Chip label={group.name} /> : null}
            {member ? (
              <Chip label={memberName(member)} variant="outline" />
            ) : null}
            {task.dueAt ? (
              <span className={styles.due} data-late={isLate}>
                <Icon name="time" />
                {DueText.due(when(task.dueAt))}
                {isLate ? ` · ${DueText.late}` : ""}
              </span>
            ) : (
              <span className={styles.due}>{DueText.noDue}</span>
            )}
            {taskTags.map((tag) => (
              <Chip key={tag.id} label={tag.name} color={tag.color} />
            ))}
          </span>
        }
        actions={actions}
      />

      {statuses.items.length > 0 ? (
        <TaskProgress statuses={statuses.items} currentId={task.statusId} />
      ) : null}

      {draft ? (
        <section className={styles.editCard} aria-label={Text.editTitle}>
          {save.error ? (
            <Banner tone="error">{dataErrorMessage(save.error)}</Banner>
          ) : null}
          <TaskForm
            draft={draft}
            onChange={(changes) =>
              setDraft((current) =>
                current ? { ...current, ...changes } : current,
              )
            }
            options={formOptions}
            showProblems={tried}
            withSections
          />
        </section>
      ) : (
        <div className={styles.columns}>
          <div className={styles.main}>
            {hasDetails ? (
              <>
                {task.notes || (task.links?.length ?? 0) > 0 ? (
                  <HowToCard task={task} />
                ) : null}
                <PostTextCard task={task} settings={platforms.settings} />
                <ChecklistCard
                  task={task}
                  canTick={abilities.canWork || abilities.canEdit}
                />
              </>
            ) : (
              <p className={styles.noDetails}>{Text.noDetails}</p>
            )}
          </div>
          <div className={styles.side}>
            <NextStepCard
              key={task.liveLink ?? ""}
              task={task}
              statuses={statuses.items}
              abilities={abilities}
              formatWhen={when}
            />
            {task.needsApproval ? (
              <ApprovalCard
                task={task}
                members={members.records}
                formatWhen={when}
              />
            ) : null}
            <AssignedCard
              task={task}
              groups={groups.items.map((item) => item.group)}
              members={members.records.filter(isCurrentMember)}
              canReassign={abilities.canReassign}
            />
          </div>
        </div>
      )}

      {isConfirmingDelete ? (
        <Modal
          title={Text.confirmDelete.title(task.title)}
          onClose={() => setIsConfirmingDelete(false)}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => setIsConfirmingDelete(false)}
              >
                {Text.cancel}
              </Button>
              <Button
                variant="danger"
                iconStart="trash"
                isLoading={remove.isPending}
                onClick={() => remove.mutate()}
              >
                {Text.confirmDelete.confirm}
              </Button>
            </>
          }
        >
          <p className={styles.text}>{Text.confirmDelete.body}</p>
        </Modal>
      ) : null}

      {blocker.state === "blocked" ? (
        <Modal
          title={Text.discard.title}
          onClose={() => blocker.reset()}
          footer={
            <>
              <Button onClick={() => blocker.reset()}>
                {Text.discard.keep}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setDraft(null);
                  blocker.proceed();
                }}
              >
                {Text.discard.confirm}
              </Button>
            </>
          }
        >
          <p className={styles.text}>{Text.discard.body}</p>
        </Modal>
      ) : null}
    </>
  );
}

export function TaskView() {
  const { taskId } = useParams();
  const { task } = useTask(taskId);

  return (
    <div className={styles.page}>
      {task === undefined ? (
        <div className={styles.loading}>
          <Spinner label={Text.loading} />
        </div>
      ) : task === null ? (
        <div className={styles.missing}>
          <Banner tone="info">{Text.notFound}</Banner>
          <LinkButton to={RoutePaths.myTasks} iconStart="back" variant="ghost">
            {Text.back}
          </LinkButton>
        </div>
      ) : (
        <TaskPage key={task.id} task={task} />
      )}
    </div>
  );
}

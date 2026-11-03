// File : /TeamSamsara.Workflow/app/src/features/tasks/ui/NextStepCard.tsx
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : What the viewer can do next with a task: the one or two buttons
// that move it on (send for review, mark as done, approve, ask for changes,
// reopen), the link to what was published when the task asks for it, and, for
// people who may edit any task, a status list to put it anywhere.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { dataErrorMessage, type StatusRecord } from "@/core/data";
import { checkLink } from "@/features/work-groups";
import { Button } from "@/shared/components/Button/Button";
import { Select } from "@/shared/components/Fields/Select/Select";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { useToast } from "@/shared/components/Toast/useToast";
import type { TaskPermissions } from "../hooks/useTaskAbilities";
import {
  isDoneCategory,
  missingReviewStatus,
  nextActions,
  type TaskAction,
} from "../model/taskStatusFlow";
import { moveTask, setLiveLink, setTaskStatus } from "../service/taskService";
import { TaskLimits, type TaskRecord } from "../types/taskTypes";
import { AskForChangesDialog } from "./AskForChangesDialog";
import { NextStepText as Text } from "./tasksContent";
import styles from "./TaskCards.module.css";

interface NextStepCardProps {
  task: TaskRecord;
  statuses: readonly StatusRecord[];
  abilities: TaskPermissions;
  formatWhen: (date: Date) => string;
}

const buttonLabel: Record<TaskAction["kind"], string> = {
  sendForReview: Text.sendForReview,
  markDone: Text.markDone,
  approve: Text.approve,
  askForChanges: Text.askForChanges,
  reopen: Text.reopen,
};

export function NextStepCard({
  task,
  statuses,
  abilities,
  formatWhen,
}: NextStepCardProps) {
  const toast = useToast();
  const [link, setLink] = useState(task.liveLink ?? "");
  const [linkTried, setLinkTried] = useState(false);
  const [isAskingForChanges, setIsAskingForChanges] = useState(false);
  const actions = nextActions(task, statuses, abilities);
  const finishes = (statusId: string) =>
    isDoneCategory(
      statuses.find((status) => status.id === statusId)?.category ?? "open",
    );

  const move = useMutation({
    mutationFn: ({ action, note }: { action: TaskAction; note?: string }) =>
      moveTask(task.id, action, {
        by: abilities.viewerId ?? "",
        finishes: finishes(action.statusId),
        note,
      }),
    onSuccess: (_result, { action }) => {
      toast.show({ tone: "success", title: Text.moved[action.kind] });
      setIsAskingForChanges(false);
    },
    onError: (error) =>
      toast.show({
        tone: "error",
        title: Text.moveFailed,
        detail: dataErrorMessage(error),
      }),
  });
  const status = useMutation({
    mutationFn: (statusId: string) =>
      setTaskStatus(task.id, statusId, finishes(statusId)),
    onError: (error) =>
      toast.show({
        tone: "error",
        title: Text.moveFailed,
        detail: dataErrorMessage(error),
      }),
  });
  const saveLink = useMutation({
    mutationFn: () => setLiveLink(task.id, link),
    onSuccess: () => toast.show({ tone: "success", title: Text.linkSaved }),
    onError: (error) =>
      toast.show({
        tone: "error",
        title: Text.moveFailed,
        detail: dataErrorMessage(error),
      }),
  });

  const canSetLink =
    task.asksForLiveLink && (abilities.canWork || abilities.canEdit);
  const linkProblem = link.trim()
    ? checkLink({ label: "link", url: link }) && Text.liveLinkInvalid
    : undefined;
  const busy = move.isPending || status.isPending;

  return (
    <section className={styles.card} aria-labelledby="task-next">
      <h2 id="task-next" className={styles.title}>
        {Text.title}
      </h2>

      {abilities.canEdit ? (
        <Select
          label={Text.status}
          help={Text.statusHelp}
          options={[...statuses]
            .sort((a, b) => a.position - b.position)
            .map((entry) => ({ value: entry.id, label: entry.name }))}
          value={task.statusId}
          onChange={(event) => status.mutate(event.target.value)}
          disabled={busy}
        />
      ) : null}

      {canSetLink ? (
        <div className={styles.linkRow}>
          <TextField
            label={Text.liveLink}
            help={Text.liveLinkHelp}
            type="url"
            inputMode="url"
            placeholder={Text.liveLinkPlaceholder}
            value={link}
            maxLength={TaskLimits.liveLink}
            onChange={(event) => setLink(event.target.value)}
            error={linkTried ? linkProblem : undefined}
            className={styles.linkField}
          />
          <Button
            className={styles.linkButton}
            onClick={() => {
              setLinkTried(true);
              if (!linkProblem) saveLink.mutate();
            }}
            disabled={link.trim() === (task.liveLink ?? "")}
            isLoading={saveLink.isPending}
          >
            {Text.saveLink}
          </Button>
        </div>
      ) : task.liveLink ? (
        <a href={task.liveLink} target="_blank" rel="noopener noreferrer">
          {task.liveLink}
        </a>
      ) : null}

      {missingReviewStatus(task, statuses) ? (
        <p className={styles.muted}>{Text.noReviewStatus}</p>
      ) : null}

      {actions.length > 0 ? (
        <div className={styles.actions}>
          {actions.map((action) => (
            <Button
              key={action.kind}
              variant={
                action.kind === "askForChanges" || action.kind === "reopen"
                  ? "secondary"
                  : "primary"
              }
              iconStart={
                action.kind === "approve" || action.kind === "markDone"
                  ? "check"
                  : undefined
              }
              onClick={() =>
                action.kind === "askForChanges"
                  ? setIsAskingForChanges(true)
                  : move.mutate({ action })
              }
              disabled={
                busy ||
                (action.kind === "markDone" && action.blockedBy !== null)
              }
              isLoading={
                move.isPending && move.variables?.action.kind === action.kind
              }
            >
              {buttonLabel[action.kind]}
            </Button>
          ))}
        </div>
      ) : abilities.canEdit ? null : (
        <p className={styles.muted}>{Text.nothing}</p>
      )}

      {actions.some(
        (action) => action.kind === "markDone" && action.blockedBy,
      ) ? (
        <p className={styles.muted}>{Text.needsLiveLink}</p>
      ) : null}
      {actions.some((action) => action.kind === "sendForReview") ? (
        <p className={styles.muted}>{Text.sendForReviewHint}</p>
      ) : null}
      {task.doneAt ? (
        <p className={styles.muted}>{Text.doneOn(formatWhen(task.doneAt))}</p>
      ) : null}

      {isAskingForChanges ? (
        <AskForChangesDialog
          isSending={move.isPending}
          onClose={() => setIsAskingForChanges(false)}
          onSend={(note) => {
            const action = actions.find(
              (entry) => entry.kind === "askForChanges",
            );
            if (action) move.mutate({ action, note });
          }}
        />
      ) : null}
    </section>
  );
}

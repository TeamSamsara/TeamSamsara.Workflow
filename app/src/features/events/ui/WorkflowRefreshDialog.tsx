// File : /TeamSamsara.Workflow/app/src/features/events/ui/WorkflowRefreshDialog.tsx
// Version : 1.1.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : "Update tasks from workflows" on an event: lists its open tasks
// that differ from what their steps make now (and what differs), each ticked
// to update; due times only move when asked. Steps with no task on the event
// can be made too, unticked at first.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { dataErrorMessage } from "@/core/data";
import { useSession } from "@/core/session";
import { startingStatus, useStatuses } from "@/features/task-setup";
import { useWorkflows } from "@/features/workflows";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Checkbox } from "@/shared/components/Fields/Checkbox/Checkbox";
import { Modal } from "@/shared/components/Modal/Modal";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { useToast } from "@/shared/components/Toast/useToast";
import { useEventTasks, useSeesEventTasks } from "../hooks/useEvents";
import { useTaskFormats } from "../hooks/useTaskFormats";
import { planWorkflowRefresh } from "../model/workflowRefresh";
import { refreshEventTasks } from "../service/eventService";
import type { EventRecord } from "../types/eventTypes";
import { EventActionsText } from "./eventActionsContent";
import styles from "./WorkflowRefreshDialog.module.css";

const Text = EventActionsText.refreshDialog;

interface WorkflowRefreshDialogProps {
  event: EventRecord;
  onClose: () => void;
}

export function WorkflowRefreshDialog({
  event,
  onClose,
}: WorkflowRefreshDialogProps) {
  const session = useSession();
  const member = session.status === "active" ? session.member : null;
  const tasks = useEventTasks(event.id, member);
  const seesAll = useSeesEventTasks();
  const workflows = useWorkflows();
  const statuses = useStatuses();
  const formats = useTaskFormats();
  const toast = useToast();
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(new Set());
  const [added, setAdded] = useState<ReadonlySet<string>>(new Set());
  const [withDue, setWithDue] = useState(false);

  const isReady =
    tasks.status === "ready" &&
    workflows.status === "ready" &&
    statuses.status !== "loading";
  const plan = isReady
    ? planWorkflowRefresh(event, workflows.items, tasks.items, formats)
    : null;
  // Only someone who sees every task can tell which steps have none.
  const newSteps = seesAll ? (plan?.newSteps ?? []) : [];
  const stepKey = (step: { workflowId: string; stepId: string }) =>
    `${step.workflowId}/${step.stepId}`;
  const chosen = (plan?.updates ?? []).filter(
    (update) => !skipped.has(update.taskId),
  );
  const chosenSteps = newSteps.filter((step) => added.has(stepKey(step)));
  const anyDue = (plan?.updates ?? []).some((update) =>
    update.parts.includes("due"),
  );
  const startId = startingStatus(statuses.items)?.id ?? null;

  const save = useMutation({
    mutationFn: () => {
      if (!member || !startId) throw new Error("Not ready");
      return refreshEventTasks(event.id, chosen, withDue, chosenSteps, {
        startingStatusId: startId,
        createdBy: member.id,
      });
    },
    onSuccess: () => {
      toast.show({
        tone: "success",
        title: Text.saved(chosen.length + chosenSteps.length),
      });
      onClose();
    },
  });

  const toggle = (
    set: ReadonlySet<string>,
    key: string,
    update: (next: ReadonlySet<string>) => void,
  ) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    update(next);
  };

  const isEmpty =
    plan !== null && plan.updates.length === 0 && newSteps.length === 0;

  return (
    <Modal
      title={Text.title}
      description={Text.description(event.title)}
      size="wide"
      onClose={save.isPending ? undefined : onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
            {Text.cancel}
          </Button>
          {isEmpty ? null : (
            <Button
              variant="primary"
              isLoading={save.isPending}
              disabled={
                !plan || chosen.length + chosenSteps.length === 0 || !startId
              }
              onClick={() => save.mutate()}
            >
              {Text.save}
            </Button>
          )}
        </>
      }
    >
      {save.error ? (
        <Banner tone="error">{dataErrorMessage(save.error)}</Banner>
      ) : null}
      {!plan ? (
        <div className={styles.loading}>
          <Spinner label={Text.loading} />
        </div>
      ) : isEmpty ? (
        <p className={styles.muted}>{Text.upToDate}</p>
      ) : (
        <div className={styles.body}>
          {plan.updates.length > 0 ? (
            <section className={styles.group}>
              <h3 className={styles.heading}>{Text.changes}</h3>
              <ul className={styles.list}>
                {plan.updates.map((update) => (
                  <li key={update.taskId} className={styles.row}>
                    <Checkbox
                      label={update.title}
                      description={update.parts
                        .map((part) => Text.parts[part])
                        .join(", ")}
                      checked={!skipped.has(update.taskId)}
                      onChange={() =>
                        toggle(skipped, update.taskId, setSkipped)
                      }
                    />
                  </li>
                ))}
              </ul>
              {anyDue ? (
                <Checkbox
                  label={Text.withDue}
                  checked={withDue}
                  onChange={(change) => setWithDue(change.target.checked)}
                />
              ) : null}
            </section>
          ) : null}
          {newSteps.length > 0 ? (
            <section className={styles.group}>
              <h3 className={styles.heading}>{Text.newSteps}</h3>
              <p className={styles.muted}>{Text.newStepsHelp}</p>
              <ul className={styles.list}>
                {newSteps.map((step) => (
                  <li key={stepKey(step)} className={styles.row}>
                    <Checkbox
                      label={step.title}
                      checked={added.has(stepKey(step))}
                      onChange={() => toggle(added, stepKey(step), setAdded)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </Modal>
  );
}

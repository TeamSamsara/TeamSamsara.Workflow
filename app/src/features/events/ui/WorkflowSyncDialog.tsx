// File : /TeamSamsara.Workflow/app/src/features/events/ui/WorkflowSyncDialog.tsx
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : After a workflow is saved: the tasks it already made for upcoming
// events that will follow the change, the ones whose new due time has passed
// (each with "Move it anyway"), and the ones left as they are and why. Only
// new events, or Update the tasks. Closes by itself when nothing is affected.

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { dataErrorMessage } from "@/core/data";
import { useSession } from "@/core/session";
import { useDisplayTime } from "@/core/workspace";
import { formatDue } from "@/features/tasks";
import type { WorkflowRecord } from "@/features/workflows";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Checkbox } from "@/shared/components/Fields/Checkbox/Checkbox";
import { Modal } from "@/shared/components/Modal/Modal";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { useToast } from "@/shared/components/Toast/useToast";
import { Icon } from "@/shared/icons/Icon";
import { formatDate } from "@/shared/time/dates";
import { useTaskFormats } from "../hooks/useTaskFormats";
import {
  describeStepChanges,
  hasSyncWork,
  planWorkflowSync,
  type SyncUpdate,
} from "../model/workflowSync";
import {
  applyWorkflowSync,
  readSyncSource,
} from "../service/workflowSyncService";
import { WorkflowSyncText as Text } from "./workflowSyncContent";
import styles from "./WorkflowSyncDialog.module.css";

/** How many rows show before "Show all". */
const shortList = 6;

interface WorkflowSyncDialogProps {
  /** The workflow as it was before the save. */
  before: WorkflowRecord;
  /** The workflow as saved. */
  after: WorkflowRecord;
  onClose: () => void;
}

export function WorkflowSyncDialog({
  before,
  after,
  onClose,
}: WorkflowSyncDialogProps) {
  const session = useSession();
  const memberId = session.status === "active" ? session.member.id : "";
  const time = useDisplayTime();
  const formats = useTaskFormats();
  const toast = useToast();
  const [now] = useState(() => new Date());
  const [moveAnyway, setMoveAnyway] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [showAll, setShowAll] = useState(false);

  const source = useQuery({
    queryKey: ["workflowSync", after.id, now.getTime()],
    queryFn: () => readSyncSource(after.id, now),
    staleTime: Infinity,
    retry: false,
  });

  const plan = useMemo(
    () =>
      source.data
        ? planWorkflowSync(
            before,
            after,
            source.data.tasks,
            source.data.events,
            formats,
            now,
          )
        : null,
    [source.data, before, after, formats, now],
  );
  const changes = useMemo(
    () =>
      describeStepChanges(before, after, formats.clock, {
        due: Text.stepDue,
        wording: Text.stepWording,
      }),
    [before, after, formats.clock],
  );

  const isEmpty = plan !== null && !hasSyncWork(plan);
  useEffect(() => {
    if (isEmpty) onClose();
  }, [isEmpty, onClose]);

  const apply = useMutation({
    mutationFn: () => {
      if (!plan) throw new Error("Nothing to update");
      return applyWorkflowSync(plan, moveAnyway, {
        workflowId: after.id,
        workflowName: after.name,
        byId: memberId,
        changes,
      });
    },
    onSuccess: (count) => {
      if (count > 0)
        toast.show({ tone: "success", title: Text.updated(count) });
      onClose();
    },
  });

  if (isEmpty) return null;

  const due = (date: Date | null) =>
    date
      ? formatDue(date, time.timeZone, time.timeFormat, time.dateFormat, now)
      : "";
  const eventLabel = (update: Pick<SyncUpdate, "eventTitle" | "eventStart">) =>
    `${update.eventTitle} · ${formatDate(update.eventStart, time.timeZone, time.dateFormat)}`;

  const eventCount = source.data?.events.length ?? 0;
  const updateCount =
    (plan?.update.length ?? 0) +
    (plan?.alreadyLate.filter(
      (update) =>
        moveAnyway.has(update.taskId) ||
        update.parts.some((part) => part !== "due"),
    ).length ?? 0);
  const shownUpdates = showAll
    ? (plan?.update ?? [])
    : (plan?.update.slice(0, shortList) ?? []);
  const busy = apply.isPending;

  function toggleLate(taskId: string) {
    setMoveAnyway((current) => {
      const next = new Set(current);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  return (
    <Modal
      title={Text.title}
      description={
        plan ? (
          <>
            <b>{after.name}</b> {Text.usedBy(eventCount)}
            {changes.length > 0
              ? ` ${Text.yourChanges} ${changes.join(" ")}`
              : null}
          </>
        ) : undefined
      }
      onClose={busy ? undefined : onClose}
      dismissible={!busy}
      size="wide"
      footer={
        plan ? (
          <>
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              {Text.onlyNew}
            </Button>
            <Button
              variant="primary"
              onClick={() => apply.mutate()}
              isLoading={busy}
              disabled={updateCount === 0}
            >
              {Text.update(updateCount)}
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={onClose}>
            {Text.onlyNew}
          </Button>
        )
      }
    >
      {source.isPending ? (
        <div className={styles.loading}>
          <Spinner label={null} />
          <span>{Text.checking}</span>
        </div>
      ) : null}
      {source.error ? (
        <Banner tone="error">
          {Text.readFailed}: {dataErrorMessage(source.error)}
        </Banner>
      ) : null}
      {apply.error ? (
        <Banner tone="error">
          {Text.updateFailed}: {dataErrorMessage(apply.error)}
        </Banner>
      ) : null}
      {plan ? (
        <div className={styles.body}>
          {plan.update.length > 0 ? (
            <section className={styles.group}>
              <h3 className={styles.heading}>
                {Text.willUpdate(plan.update.length)}
              </h3>
              <ul className={styles.list}>
                {shownUpdates.map((update) => (
                  <li key={update.taskId} className={styles.row}>
                    <span className={styles.what}>
                      <b>{eventLabel(update)}</b>
                      <span className={styles.muted}>
                        {update.title}
                        {update.keptParts.length > 0
                          ? `. ${Text.keptNote(update.keptParts.map((part) => Text.parts[part]).join(", "))}`
                          : null}
                      </span>
                    </span>
                    {update.parts.includes("due") ? (
                      <span className={styles.move}>
                        <span className={styles.muted}>
                          {due(update.fromDue)}
                        </span>
                        <Icon name="next" className={styles.muted} />
                        <b>{due(update.toDue)}</b>
                      </span>
                    ) : (
                      <span className={styles.muted}>{Text.textOnly}</span>
                    )}
                  </li>
                ))}
              </ul>
              {plan.update.length > shortList ? (
                <Button
                  variant="ghost"
                  size="small"
                  className={styles.more}
                  onClick={() => setShowAll((current) => !current)}
                  aria-expanded={showAll}
                >
                  {showAll ? Text.showFewer : Text.showAll(plan.update.length)}
                </Button>
              ) : null}
            </section>
          ) : null}

          {plan.alreadyLate.length > 0 ? (
            <section className={styles.group}>
              <h3 className={styles.heading}>
                {Text.alreadyLate(plan.alreadyLate.length)}
              </h3>
              <div className={styles.late}>
                {plan.alreadyLate.map((update) => (
                  <div key={update.taskId} className={styles.lateItem}>
                    <span>
                      <b>{eventLabel(update)}</b>
                      <span className={styles.muted}>
                        {" · "}
                        {update.title}:{" "}
                        {Text.lateDetail(
                          due(update.toDue),
                          due(update.fromDue),
                        )}
                      </span>
                    </span>
                    <Checkbox
                      label={Text.moveAnyway}
                      checked={moveAnyway.has(update.taskId)}
                      onChange={() => toggleLate(update.taskId)}
                      disabled={busy}
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {plan.leftAlone.length > 0 ? (
            <section className={styles.group}>
              <h3 className={styles.heading}>
                {Text.leftAlone(plan.leftAlone.length)}
              </h3>
              <ul className={styles.plain}>
                {plan.leftAlone.map((task) => (
                  <li key={task.taskId}>
                    {task.eventTitle} · {task.title}:{" "}
                    <b>
                      {task.reason === "edited" && task.parts.length > 0
                        ? `${Text.reasons.edited} (${Text.editedParts(task.parts.map((part) => Text.parts[part]).join(", "))})`
                        : Text.reasons[task.reason]}
                    </b>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className={styles.note}>{Text.newEventsNote}</p>
        </div>
      ) : null}
    </Modal>
  );
}

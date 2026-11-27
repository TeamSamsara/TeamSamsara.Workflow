// File : /TeamSamsara.Workflow/app/src/features/tasks/ui/OrderCard.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-tasks-follow-order
// Author : Gerrah
// Purpose : Where a task from a workflow sits in its event's order: what it
// waits on (and whether it's locked, unlocked because it's late, or started
// anyway, with the reason), Start anyway for whoever has it or a lead, then
// the tasks that come before it and the ones after it.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { dataErrorMessage } from "@/core/data";
import { Button } from "@/shared/components/Button/Button";
import { TextArea } from "@/shared/components/Fields/TextArea/TextArea";
import { Modal } from "@/shared/components/Modal/Modal";
import { useToast } from "@/shared/components/Toast/useToast";
import { taskPath } from "@/shared/constants/routePaths";
import { Icon } from "@/shared/icons/Icon";
import type { TaskPermissions } from "../hooks/useTaskAbilities";
import { startAnyway } from "../service/taskService";
import { TaskLimits, type TaskRecord } from "../types/taskTypes";
import { OrderCardText as Text } from "./tasksContent";
import styles from "./TaskCards.module.css";

/** Another task of the event, linked when the viewer can open it. */
export interface OrderNeighbour {
  stepId: string;
  title: string;
  /** Null when the viewer can't open it. */
  taskId: string | null;
  done: boolean;
  /** What it has to do first, or "order" when it's only the order. */
  condition: TaskRecord["waitsOn"][number]["condition"];
}

interface OrderCardProps {
  task: TaskRecord;
  abilities: TaskPermissions;
  /** The tasks it comes after, and the ones that come after it. */
  before: readonly OrderNeighbour[];
  after: readonly OrderNeighbour[];
  /** Who started it anyway, by name. */
  startedBy: string | null;
  formatWhen: (date: Date) => string;
}

function Neighbours({
  title,
  items,
}: {
  title: string;
  items: readonly OrderNeighbour[];
}) {
  if (items.length === 0) return null;
  return (
    <div className={styles.orderGroup}>
      <h3 className={styles.orderHeading}>{title}</h3>
      <ul className={styles.orderList}>
        {items.map((item) => (
          <li
            key={item.stepId}
            className={styles.orderItem}
            data-kind={item.condition === "order" ? "soft" : "hard"}
          >
            {item.taskId ? (
              <Link to={taskPath(item.taskId)} className={styles.plainLink}>
                {item.title}
              </Link>
            ) : (
              <span>{item.title}</span>
            )}
            <span className={styles.muted}>
              {item.done ? Text.done : Text.condition[item.condition]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OrderCard({
  task,
  abilities,
  before,
  after,
  startedBy,
  formatWhen,
}: OrderCardProps) {
  const toast = useToast();
  const [isAsking, setIsAsking] = useState(false);
  const [reason, setReason] = useState("");
  const start = useMutation({
    mutationFn: () => startAnyway(task.id, abilities.viewerId ?? "", reason),
    onSuccess: () => {
      toast.show({ tone: "success", title: Text.started });
      setIsAsking(false);
    },
    onError: (error) =>
      toast.show({ tone: "error", title: dataErrorMessage(error) }),
  });
  if (before.length === 0 && after.length === 0 && task.waitingOn.length === 0)
    return null;

  return (
    <section className={styles.card} aria-labelledby="task-order-title">
      <div className={styles.header}>
        <h2 id="task-order-title" className={styles.title}>
          {Text.title}
        </h2>
        {task.priority !== "normal" ? (
          <span className={styles.muted}>
            <Icon name="priority" /> {Text.priority[task.priority]}
          </span>
        ) : null}
      </div>

      {abilities.locked ? (
        <p className={styles.quote}>
          <b>{Text.locked}</b>{" "}
          {Text.waitingOn(
            task.waitingOn.map(
              (wait) => `${wait.title} ${Text.toBe[wait.condition]}`,
            ),
            task.waitFor === "any",
          )}
        </p>
      ) : abilities.unlockedLate ? (
        <p className={styles.muted}>{Text.unlockedLate}</p>
      ) : null}
      {task.startedAnyway ? (
        <p className={styles.quote}>
          <b>
            {Text.startedAnyway(
              startedBy,
              task.startedAnyway.at ? formatWhen(task.startedAnyway.at) : null,
            )}
          </b>{" "}
          {task.startedAnyway.reason}
        </p>
      ) : null}
      {abilities.canStartAnyway ? (
        <Button
          className={styles.start}
          iconStart="next"
          onClick={() => setIsAsking(true)}
        >
          {Text.startAnyway}
        </Button>
      ) : null}

      <Neighbours title={Text.before} items={before} />
      <Neighbours title={Text.after} items={after} />

      {isAsking ? (
        <Modal
          title={Text.dialogTitle}
          onClose={start.isPending ? undefined : () => setIsAsking(false)}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => setIsAsking(false)}
                disabled={start.isPending}
              >
                {Text.cancel}
              </Button>
              <Button
                variant="primary"
                onClick={() => start.mutate()}
                disabled={!reason.trim()}
                isLoading={start.isPending}
              >
                {Text.startAnyway}
              </Button>
            </>
          }
        >
          <TextArea
            label={Text.reason}
            hint={Text.reasonHint}
            value={reason}
            rows={3}
            maxLength={TaskLimits.changesNote}
            onChange={(event) => setReason(event.target.value)}
          />
        </Modal>
      ) : null}
    </section>
  );
}

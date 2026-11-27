// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/AfterSavingDialog.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-after-saving
// Author : Gerrah
// Purpose : After saving a workflow: saving never moves anyone's tasks, so
// this lists the upcoming tasks whose due time now differs from their step,
// each with when it's due and when the step says. Move one, move them all,
// or leave them; once they're dealt with, it says what moved and what
// couldn't (someone changed it since).

import { useState } from "react";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Modal } from "@/shared/components/Modal/Modal";
import type { WorkflowReview } from "../hooks/useWorkflowReview";
import {
  leaveDifferingTasks,
  moveDifferingTasks,
} from "../service/workflowService";
import { AfterSavingText as Text } from "./workflowsContent";
import styles from "./AfterSavingDialog.module.css";

interface AfterSavingDialogProps {
  review: WorkflowReview;
  formatWhen: (date: Date) => string;
  onClose: () => void;
}

export function AfterSavingDialog({
  review,
  formatWhen,
  onClose,
}: AfterSavingDialogProps) {
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const handled = new Set([...review.move, ...review.moved, ...review.skipped]);
  const pending = review.tasks.filter((task) => !handled.has(task.taskId));
  const moving = review.move.filter(
    (id) => !review.moved.includes(id) && !review.skipped.includes(id),
  );
  const notListed = review.total - review.tasks.length;
  const decided = pending.length === 0 || review.left;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(false);
    try {
      await action();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  const move = (ids: string[]) =>
    run(() => moveDifferingTasks(review.id, review.move, ids));
  const when = (date: Date | null) => (date ? formatWhen(date) : Text.noDue);

  return (
    <Modal
      title={Text.title(review.total)}
      description={Text.description}
      size="wide"
      onClose={onClose}
      footer={
        decided ? (
          <Button variant="primary" onClick={onClose}>
            {Text.close}
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await leaveDifferingTasks(review.id);
                  onClose();
                })
              }
            >
              {Text.leave}
            </Button>
            <Button
              variant="primary"
              isLoading={busy}
              onClick={() => move(pending.map((task) => task.taskId))}
            >
              {Text.moveAll(pending.length)}
            </Button>
          </>
        )
      }
    >
      <div className={styles.body}>
        {error ? <Banner tone="error">{Text.failed}</Banner> : null}
        {pending.length > 0 && !review.left ? (
          <ul className={styles.list}>
            {pending.map((task) => (
              <li key={task.taskId} className={styles.row}>
                <span className={styles.what}>
                  <b>{task.title}</b>
                  <span className={styles.muted}>{task.eventTitle}</span>
                  {task.edited ? (
                    <span className={styles.muted}>{Text.edited}</span>
                  ) : null}
                </span>
                <span className={styles.when}>
                  <span>{Text.dueNow(when(task.from))}</span>
                  <span className={styles.to}>
                    {Text.stepSays(when(task.to))}
                  </span>
                </span>
                <Button
                  size="small"
                  disabled={busy}
                  onClick={() => move([task.taskId])}
                >
                  {Text.move}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        {moving.length > 0 ? (
          <p className={styles.muted}>{Text.moving(moving.length)}</p>
        ) : null}
        {review.moved.length > 0 ? (
          <p className={styles.text}>{Text.moved(review.moved.length)}</p>
        ) : null}
        {review.skipped.length > 0 ? (
          <p className={styles.text}>{Text.skipped(review.skipped.length)}</p>
        ) : null}
        {review.left && pending.length > 0 ? (
          <p className={styles.text}>{Text.left(pending.length)}</p>
        ) : null}
        {notListed > 0 ? (
          <p className={styles.muted}>{Text.notListed(notListed)}</p>
        ) : null}
      </div>
    </Modal>
  );
}

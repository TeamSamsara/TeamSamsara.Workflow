// File : /TeamSamsara.Workflow/app/src/features/events/ui/RefillDialog.tsx
// Version : 1.0.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : Before saving an event whose tasks use what changed: which tasks
// will be filled again, and which stay as they are and why (finished, or
// edited by hand).

import { Button } from "@/shared/components/Button/Button";
import { Modal } from "@/shared/components/Modal/Modal";
import { Icon } from "@/shared/icons/Icon";
import type { RefillPlan } from "../model/refillTasks";
import { EventActionsText } from "./eventActionsContent";
import styles from "./RefillDialog.module.css";

const Text = EventActionsText.refillDialog;

interface RefillDialogProps {
  plan: RefillPlan;
  isSaving: boolean;
  onBack: () => void;
  onSave: () => void;
}

export function RefillDialog({
  plan,
  isSaving,
  onBack,
  onSave,
}: RefillDialogProps) {
  return (
    <Modal
      title={Text.title}
      description={Text.description}
      onClose={isSaving ? undefined : onBack}
      footer={
        <>
          <Button variant="ghost" onClick={onBack} disabled={isSaving}>
            {Text.cancel}
          </Button>
          <Button variant="primary" onClick={onSave} isLoading={isSaving}>
            {Text.save(plan.updates.length)}
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        {plan.updates.length > 0 ? (
          <section className={styles.group}>
            <h3 className={styles.heading}>{Text.updates}</h3>
            <ul className={styles.list}>
              {plan.updates.map((update) => (
                <li key={update.taskId} className={styles.item}>
                  <Icon name="check" className={styles.good} />
                  <span className={styles.text}>
                    <b>{update.title}</b>
                    {update.keptParts.length > 0 ? (
                      <span className={styles.muted}>
                        {Text.editedParts(
                          update.keptParts
                            .map((part) => Text.parts[part])
                            .join(", "),
                        )}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {plan.kept.length > 0 ? (
          <section className={styles.group}>
            <h3 className={styles.heading}>{Text.kept}</h3>
            <ul className={styles.list} data-kept>
              {plan.kept.map((task) => (
                <li key={task.taskId} className={styles.item}>
                  <Icon name="lock" className={styles.muted} />
                  <span className={styles.text}>
                    <span>{task.title}</span>
                    <span className={styles.muted}>
                      {task.reason === "done" ? Text.done : Text.edited}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Modal>
  );
}

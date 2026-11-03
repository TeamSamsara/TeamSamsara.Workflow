// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/StepList.tsx
// Version : 1.1.0
// Latest commit: fix/workflow-editor-simpler
// Author : Gerrah
// Purpose : A workflow's tasks in order: each row shows its number, title, who
// it's given to and when it's due, and opens in place to edit. Rows reorder by
// dragging or with the arrow keys on the handle. One task is open at a time.

import { Button } from "@/shared/components/Button/Button";
import { Chip } from "@/shared/components/Chip/Chip";
import { HelpTip } from "@/shared/components/HelpTip/HelpTip";
import { Pill } from "@/shared/components/Pill/Pill";
import { useSortableList } from "@/shared/hooks/useSortableList";
import { Icon } from "@/shared/icons/Icon";
import { memberName } from "@/features/members";
import { describeDue } from "../model/dueOffset";
import type { WorkflowProblems } from "../model/workflowChecks";
import { canAddStep } from "../model/workflowDraft";
import { WorkflowLimits, type WorkflowStep } from "../types/workflowTypes";
import { StepEditor, type StepEditorOptions } from "./StepEditor";
import { StepListText as Text } from "./workflowsContent";
import styles from "./StepList.module.css";

interface StepListProps {
  steps: readonly WorkflowStep[];
  openStepId: string | null;
  onOpen: (stepId: string | null) => void;
  onChange: (
    stepId: string,
    changes: Partial<Omit<WorkflowStep, "id">>,
  ) => void;
  onReorder: (orderedIds: string[]) => void;
  onAdd: () => void;
  onDuplicate: (stepId: string) => void;
  onRemove: (stepId: string) => void;
  problems: WorkflowProblems;
  showProblems: boolean;
  options: StepEditorOptions;
  /** Tasks open to read, but nothing changes. */
  readOnly?: boolean;
}

export function StepList({
  steps,
  openStepId,
  onOpen,
  onChange,
  onReorder,
  onAdd,
  onDuplicate,
  onRemove,
  problems,
  showProblems,
  options,
  readOnly = false,
}: StepListProps) {
  const sortable = useSortableList({
    ids: steps.map((step) => step.id),
    disabled: readOnly,
    onReorder,
  });
  const canAdd = canAddStep(steps);

  return (
    <section className={styles.card} aria-labelledby="workflow-steps-title">
      <header className={styles.header}>
        <div className={styles.heading}>
          <h2 id="workflow-steps-title" className={styles.title}>
            {Text.title}
          </h2>
          <HelpTip topic={Text.title}>{Text.help}</HelpTip>
        </div>
        {readOnly ? null : (
          <Button
            size="small"
            iconStart="add"
            onClick={onAdd}
            disabled={!canAdd}
          >
            {Text.add}
          </Button>
        )}
      </header>

      {steps.length === 0 ? (
        <p className={styles.empty}>{Text.empty}</p>
      ) : (
        <ol className={styles.list}>
          {steps.map((step, index) => {
            const isOpen = step.id === openStepId;
            const title = step.title.trim() || Text.untitled;
            const group = options.groups.find(
              (entry) => entry.id === step.workGroupId,
            );
            const member = options.members.find(
              (entry) => entry.id === step.memberId,
            );
            const hasProblems =
              showProblems && Boolean(problems.steps[step.id]);
            const rowProps = sortable.rowProps(step.id, index);
            return (
              <li
                key={step.id}
                className={styles.step}
                data-open={isOpen}
                {...rowProps}
                // An open task holds text boxes, so only a closed one drags.
                draggable={rowProps.draggable && !isOpen}
              >
                <div className={styles.row}>
                  {readOnly ? null : (
                    <button
                      type="button"
                      className={styles.handle}
                      aria-label={Text.move(title)}
                      {...sortable.handleProps(step.id, index)}
                    >
                      <Icon name="dragHandle" />
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.toggle}
                    aria-expanded={isOpen}
                    aria-controls={`step-${step.id}`}
                    aria-label={isOpen ? Text.close(title) : Text.open(title)}
                    onClick={() => onOpen(isOpen ? null : step.id)}
                  >
                    <span
                      className={styles.name}
                      data-untitled={!step.title.trim()}
                    >
                      <span className={styles.number}>
                        {Text.number(index)}
                      </span>
                      {title}
                    </span>
                    <span className={styles.summary}>
                      {hasProblems ? (
                        <Pill tone="error">{Text.problems}</Pill>
                      ) : null}
                      {step.needsApproval ? (
                        <Pill tone="alert">{Text.needsApproval}</Pill>
                      ) : null}
                      {group ? (
                        <Chip label={group.name} variant="outline" />
                      ) : null}
                      {member ? (
                        <Chip label={memberName(member)} variant="outline" />
                      ) : null}
                      {!group && !member ? (
                        <span className={styles.muted}>{Text.unassigned}</span>
                      ) : null}
                      <span className={styles.due}>
                        <Icon name="time" />
                        {describeDue(step.due, options.clockFormat)}
                      </span>
                    </span>
                    <Icon name="chevronDown" className={styles.chevron} />
                  </button>
                </div>
                {isOpen ? (
                  <fieldset
                    id={`step-${step.id}`}
                    className={styles.body}
                    data-read-only={readOnly}
                    disabled={readOnly}
                  >
                    <StepEditor
                      step={step}
                      onChange={(changes) => onChange(step.id, changes)}
                      problems={problems.steps[step.id]}
                      showProblems={showProblems}
                      options={options}
                      onDuplicate={() => onDuplicate(step.id)}
                      canDuplicate={canAdd}
                      onRemove={() => onRemove(step.id)}
                      readOnly={readOnly}
                    />
                  </fieldset>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}

      {!canAdd && !readOnly ? (
        <p className={styles.muted}>{Text.full(WorkflowLimits.steps)}</p>
      ) : null}
    </section>
  );
}

// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/StepNav.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-order-rules
// Author : Gerrah
// Purpose : The left of the workflow editor: About this workflow, then its
// steps in due order. Each shows who it's for and when it's due, a flag when
// it's high priority, how many order rules it has, and a problem when there's
// one. Picking one opens it in the middle.

import { Button } from "@/shared/components/Button/Button";
import { Icon } from "@/shared/icons/Icon";
import { describeDue } from "../model/dueOffset";
import type { WorkflowProblems } from "../model/workflowChecks";
import { canAddStep } from "../model/workflowDraft";
import { WorkflowLimits, type WorkflowStep } from "../types/workflowTypes";
import type { StepEditorOptions } from "./StepEditor";
import { StepNavText as Text } from "./workflowsContent";
import styles from "./StepNav.module.css";

/** What's open in the middle: About, or one step by its id. */
export type EditorSelection = "about" | string;

interface StepNavProps {
  steps: readonly WorkflowStep[];
  selected: EditorSelection;
  onSelect: (selection: EditorSelection) => void;
  onAdd: () => void;
  problems: WorkflowProblems;
  showProblems: boolean;
  /** About has a problem to show (its name). */
  aboutProblem: boolean;
  options: StepEditorOptions;
  readOnly?: boolean;
}

export function StepNav({
  steps,
  selected,
  onSelect,
  onAdd,
  problems,
  showProblems,
  aboutProblem,
  options,
  readOnly = false,
}: StepNavProps) {
  const canAdd = canAddStep(steps);
  return (
    <nav className={styles.card} aria-label={Text.label}>
      <button
        type="button"
        className={styles.item}
        aria-current={selected === "about" ? "true" : undefined}
        onClick={() => onSelect("about")}
      >
        <span className={styles.name}>{Text.about}</span>
        <span className={styles.meta}>{Text.aboutMeta}</span>
        {showProblems && aboutProblem ? (
          <span className={styles.problem}>{Text.needsFixing}</span>
        ) : null}
      </button>

      <div className={styles.heading}>
        <h2 className={styles.title}>{Text.title}</h2>
        <span className={styles.hint}>{Text.inDueOrder}</span>
      </div>

      {steps.length === 0 ? (
        <p className={styles.empty}>{Text.empty}</p>
      ) : (
        <ol className={styles.list}>
          {steps.map((step, index) => {
            const group = options.groups.find(
              (entry) => entry.id === step.workGroupId,
            );
            const stepProblems = problems.steps[step.id];
            // Order problems show at once; the rest after a try to save.
            const hasProblem =
              (stepProblems?.order.length ?? 0) > 0 ||
              (showProblems && Boolean(stepProblems));
            const title = step.title.trim() || Text.untitled;
            return (
              <li key={step.id}>
                <button
                  type="button"
                  className={styles.item}
                  aria-current={selected === step.id ? "true" : undefined}
                  onClick={() => onSelect(step.id)}
                >
                  <span className={styles.name}>
                    {Text.number(index)} {title}
                    {step.priority === "high" ? (
                      <span className={styles.high} title={Text.high}>
                        <Icon name="priority" />
                      </span>
                    ) : null}
                  </span>
                  <span className={styles.meta}>
                    {[group?.name, describeDue(step.due, options.clockFormat)]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  {hasProblem ? (
                    <span className={styles.problem}>
                      {Text.problems(
                        stepProblems?.order.length || (stepProblems ? 1 : 0),
                      )}
                    </span>
                  ) : step.order.length > 0 ? (
                    <span className={styles.rules}>
                      {Text.rules(step.order.length)}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {readOnly ? null : (
        <Button iconStart="add" onClick={onAdd} disabled={!canAdd}>
          {Text.add}
        </Button>
      )}
      {!canAdd && !readOnly ? (
        <p className={styles.hint}>{Text.full(WorkflowLimits.steps)}</p>
      ) : null}
    </nav>
  );
}

// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/OrderRulesField.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-order-rules
// Author : Gerrah
// Purpose : A step's order rules: one line per rule, read left to right as
// how it relates · which step · what has to happen, each a dropdown. Steps
// that can't work are listed greyed with the reason. Under the rules, what to
// do when it waits on several steps and when what it waits on is late.

import { Button } from "@/shared/components/Button/Button";
import { IconButton } from "@/shared/components/Button/IconButton";
import { Select } from "@/shared/components/Fields/Select/Select";
import {
  conditionChoices,
  locks,
  orderLinks,
  relationChoices,
  ruleFirstStep,
  stepChoices,
} from "../model/orderRules";
import { OrderRulesText as RuleText } from "../model/orderRulesContent";
import type { OrderProblem } from "../model/orderRules";
import { newOrderRule } from "../model/workflowDraft";
import {
  WorkflowLimits,
  type OrderRelation,
  type OrderRule,
  type WaitFor,
  type WhenLate,
  type WorkflowStep,
} from "../types/workflowTypes";
import { OrderFieldText as Text } from "./workflowsContent";
import styles from "./OrderRulesField.module.css";

interface OrderRulesFieldProps {
  /** Every step, in the order the editor numbers them. */
  steps: readonly WorkflowStep[];
  step: WorkflowStep;
  onChange: (
    changes: Partial<Pick<WorkflowStep, "order" | "waitFor" | "whenLate">>,
  ) => void;
  problems: readonly OrderProblem[];
  readOnly?: boolean;
}

export function OrderRulesField({
  steps,
  step,
  onChange,
  problems,
  readOnly = false,
}: OrderRulesFieldProps) {
  const setRule = (id: string, changes: Partial<OrderRule>) =>
    onChange({
      order: step.order.map((rule) => {
        if (rule.id !== id) return rule;
        const next = { ...rule, ...changes };
        // A relation with one possible condition takes it; a condition the
        // first step can't meet goes back to Done first.
        const first = ruleFirstStep(steps, step, next);
        const allowed = conditionChoices(next.relation, first).filter(
          (choice) => !choice.disabled,
        );
        if (!allowed.some((choice) => choice.value === next.condition))
          next.condition = allowed[0]?.value ?? "done";
        return next;
      }),
    });
  // Counted from the links, so a Comes before rule on another step counts too.
  const lockCount = orderLinks(steps).filter(
    (link) => link.to === step.id && locks(link.condition),
  ).length;
  const canAdd =
    !readOnly &&
    step.order.length < WorkflowLimits.orderRules &&
    steps.length > 1;

  return (
    <div
      className={styles.field}
      role="group"
      aria-labelledby={`rules-${step.id}`}
    >
      <span id={`rules-${step.id}`} className={styles.label}>
        {Text.label}
      </span>
      <p className={styles.help}>{Text.help}</p>

      {step.order.length > 0 ? (
        <div className={styles.rules}>
          <div className={styles.head} aria-hidden>
            <span>{Text.how}</span>
            <span>{Text.which}</span>
            <span>{Text.what}</span>
            <span />
          </div>
          {step.order.map((rule, index) => {
            const first = ruleFirstStep(steps, step, rule);
            const problem = problems.find((entry) => entry.ruleId === rule.id);
            return (
              <div key={rule.id} className={styles.rule}>
                <div className={styles.row}>
                  <Select
                    label={Text.ruleHow(index)}
                    hideLabel
                    options={relationChoices()}
                    value={rule.relation}
                    onChange={(event) =>
                      setRule(rule.id, {
                        relation: event.target.value as OrderRelation,
                      })
                    }
                  />
                  <Select
                    label={Text.ruleWhich(index)}
                    hideLabel
                    placeholder={Text.chooseStep}
                    options={stepChoices(steps, step, rule, Text.untitled)}
                    value={rule.stepId}
                    onChange={(event) =>
                      setRule(rule.id, { stepId: event.target.value })
                    }
                  />
                  <Select
                    label={Text.ruleWhat(index)}
                    hideLabel
                    options={conditionChoices(rule.relation, first)}
                    value={rule.condition}
                    onChange={(event) =>
                      setRule(rule.id, {
                        condition: event.target.value as OrderRule["condition"],
                      })
                    }
                    disabled={
                      rule.relation === "with" || rule.relation === "dueFrom"
                    }
                  />
                  {readOnly ? (
                    <span />
                  ) : (
                    <IconButton
                      icon="close"
                      variant="ghost"
                      label={Text.remove(index)}
                      onClick={() =>
                        onChange({
                          order: step.order.filter(
                            (entry) => entry.id !== rule.id,
                          ),
                        })
                      }
                    />
                  )}
                </div>
                <p className={styles.explain}>
                  {RuleText.relationHelp[rule.relation]}{" "}
                  {rule.relation === "after" || rule.relation === "before"
                    ? RuleText.conditionHelp[rule.condition]
                    : null}
                </p>
                {problem ? (
                  <p className={styles.problem} role="alert">
                    {problem.message}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className={styles.none}>{Text.none}</p>
      )}

      {canAdd ? (
        <Button
          size="small"
          iconStart="add"
          className={styles.add}
          onClick={() => onChange({ order: [...step.order, newOrderRule()] })}
        >
          {Text.add}
        </Button>
      ) : null}

      {lockCount > 0 ? (
        <div className={styles.settings}>
          <Select
            label={Text.waitFor}
            options={[
              { value: "all", label: Text.waitForAll },
              { value: "any", label: Text.waitForAny },
            ]}
            value={step.waitFor}
            onChange={(event) =>
              onChange({ waitFor: event.target.value as WaitFor })
            }
            hint={lockCount < 2 ? Text.waitForOne : undefined}
            disabled={lockCount < 2}
          />
          <Select
            label={Text.whenLate}
            options={[
              { value: "wait", label: Text.whenLateWait },
              { value: "unlock", label: Text.whenLateUnlock },
            ]}
            value={step.whenLate}
            onChange={(event) =>
              onChange({ whenLate: event.target.value as WhenLate })
            }
          />
        </div>
      ) : null}
    </div>
  );
}

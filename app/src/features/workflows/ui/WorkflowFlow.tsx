// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/WorkflowFlow.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-flow-view
// Author : Gerrah
// Purpose : The workflow editor's Flow view: the steps as a flow, with the
// two kinds of link and what's out of order. Picking a step shows its due
// time, order rules and priority, with the same words as the step editor, and
// Open the whole step; picking a link lets you make it "has to be done first"
// or "only the order", or remove it. Dragging from a step's edge onto another
// links them. Beside it, the workflow's checks.

import { useState } from "react";
import { Button } from "@/shared/components/Button/Button";
import { Select } from "@/shared/components/Fields/Select/Select";
import { Icon } from "@/shared/icons/Icon";
import { linkSteps, stepFlow } from "../model/flow";
import type { WorkflowProblems } from "../model/workflowChecks";
import type { Priority, WorkflowStep } from "../types/workflowTypes";
import { DueOffsetField } from "./DueOffsetField";
import { FlowChart, FlowLegend } from "./FlowChart";
import { OrderRulesField } from "./OrderRulesField";
import type { StepEditorOptions } from "./StepEditor";
import { StepEditorText, WorkflowFlowText as Text } from "./workflowsContent";
import styles from "./WorkflowFlow.module.css";

interface WorkflowFlowProps {
  /** Every step, in due order. */
  steps: readonly WorkflowStep[];
  problems: WorkflowProblems;
  options: StepEditorOptions;
  selectedId: string | null;
  onSelect: (stepId: string) => void;
  onChangeStep: (
    stepId: string,
    changes: Partial<Omit<WorkflowStep, "id">>,
  ) => void;
  onReplaceSteps: (steps: WorkflowStep[]) => void;
  onOpenStep: (stepId: string) => void;
  readOnly: boolean;
}

export function WorkflowFlow({
  steps,
  problems,
  options,
  selectedId,
  onSelect,
  onChangeStep,
  onReplaceSteps,
  onOpenStep,
  readOnly,
}: WorkflowFlowProps) {
  const [linkId, setLinkId] = useState<string | null>(null);
  const [refused, setRefused] = useState(false);
  const flow = stepFlow(steps, options.clockFormat);
  const name = (step: WorkflowStep) =>
    `${steps.indexOf(step) + 1}. ${step.title.trim() || StepEditorText.untitled}`;
  const who = (step: WorkflowStep) =>
    options.members.find((member) => member.id === step.memberId)
      ?.displayName ??
    options.groups.find((group) => group.id === step.workGroupId)?.name ??
    null;
  const problemCount = steps.reduce(
    (sum, step) => sum + (problems.steps[step.id]?.order.length ?? 0),
    0,
  );
  const selected = steps.find((step) => step.id === selectedId);
  const link = flow.links.find((entry) => entry.id === linkId);
  const linkOwner = link
    ? steps.find((step) => step.id === link.ownerId)
    : undefined;
  const linkRule = linkOwner?.order.find((rule) => rule.id === link?.ruleId);

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <FlowLegend
          extra={
            <>
              <span className={styles.flag}>
                <Icon name="priority" /> {Text.high}
              </span>
              {problemCount > 0 ? (
                <b className={styles.problems}>{Text.problems(problemCount)}</b>
              ) : null}
            </>
          }
        />
        <FlowChart
          label={Text.label}
          columns={flow.columns}
          startsBefore={flow.startsBefore}
          nodes={steps.map((step) => ({
            id: step.id,
            column: flow.columnOf[step.id] ?? 0,
            title: name(step),
            meta: [
              who(step),
              step.needsApproval ? StepEditorText.needsApproval : null,
              problems.steps[step.id]?.order[0]?.message ?? null,
            ].filter(Boolean),
            badge:
              step.priority === "high" ? (
                <span className={styles.flag} title={Text.high}>
                  <Icon name="priority" />
                </span>
              ) : null,
            problem: (problems.steps[step.id]?.order.length ?? 0) > 0,
          }))}
          links={flow.links}
          selectedId={selectedId}
          selectedLinkId={linkId}
          onSelect={(stepId) => {
            setLinkId(null);
            onSelect(stepId);
          }}
          onSelectLink={readOnly ? undefined : setLinkId}
          onLink={
            readOnly
              ? undefined
              : (from, to) => {
                  const next = linkSteps(steps, from, to);
                  setRefused(next === null);
                  if (next) onReplaceSteps(next);
                }
          }
        />
        <p className={styles.hint}>{refused ? Text.refused : Text.howToLink}</p>
      </div>

      <aside className={styles.side} aria-label={Text.sideLabel}>
        {link && linkOwner && linkRule ? (
          <section className={styles.card} aria-label={Text.linkTitle}>
            <h3 className={styles.title}>{Text.linkTitle}</h3>
            <p className={styles.muted}>
              {Text.linkBetween(
                name(steps.find((step) => step.id === link.from)!),
                name(steps.find((step) => step.id === link.to)!),
              )}
            </p>
            <Select
              label={Text.linkKind}
              options={[
                { value: "done", label: Text.hardLink },
                { value: "order", label: Text.softLink },
              ]}
              value={linkRule.condition === "order" ? "order" : "done"}
              onChange={(event) =>
                onChangeStep(linkOwner.id, {
                  order: linkOwner.order.map((rule) =>
                    rule.id === linkRule.id
                      ? {
                          ...rule,
                          condition:
                            event.target.value === "order" ? "order" : "done",
                        }
                      : rule,
                  ),
                })
              }
              disabled={linkRule.relation === "dueFrom"}
            />
            <Button
              size="small"
              variant="danger"
              iconStart="trash"
              onClick={() => {
                onChangeStep(linkOwner.id, {
                  order: linkOwner.order.filter(
                    (rule) => rule.id !== linkRule.id,
                  ),
                });
                setLinkId(null);
              }}
            >
              {Text.removeLink}
            </Button>
          </section>
        ) : selected ? (
          <section className={styles.card} aria-label={name(selected)}>
            <h3 className={styles.title}>{name(selected)}</h3>
            <fieldset className={styles.fields} disabled={readOnly}>
              <DueOffsetField
                label={StepEditorText.due}
                value={selected.due}
                onChange={(due) => onChangeStep(selected.id, { due })}
                clockFormat={options.clockFormat}
              />
              <OrderRulesField
                steps={steps}
                step={selected}
                onChange={(changes) => onChangeStep(selected.id, changes)}
                problems={problems.steps[selected.id]?.order ?? []}
                readOnly={readOnly}
              />
              <Select
                label={StepEditorText.priority}
                options={[
                  { value: "high", label: StepEditorText.priorities.high },
                  { value: "normal", label: StepEditorText.priorities.normal },
                  { value: "low", label: StepEditorText.priorities.low },
                ]}
                value={selected.priority}
                onChange={(event) =>
                  onChangeStep(selected.id, {
                    priority: event.target.value as Priority,
                  })
                }
              />
            </fieldset>
            <Button size="small" onClick={() => onOpenStep(selected.id)}>
              {Text.openStep}
            </Button>
          </section>
        ) : (
          <p className={styles.muted}>{Text.pick}</p>
        )}

        <section className={styles.card} aria-label={Text.checks}>
          <h3 className={styles.title}>{Text.checks}</h3>
          {problemCount === 0 ? (
            <ul className={styles.passing}>
              {Text.passing.map((line) => (
                <li key={line}>
                  <Icon name="check" />
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <ul className={styles.problemList}>
              {steps.flatMap((step) =>
                (problems.steps[step.id]?.order ?? []).map((problem, index) => (
                  <li key={`${step.id}-${index}`}>
                    <button
                      type="button"
                      className={styles.problemLink}
                      onClick={() => onSelect(step.id)}
                    >
                      <b>{name(step)}</b>
                      <span>{problem.message}</span>
                    </button>
                  </li>
                )),
              )}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}

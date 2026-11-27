// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/StepRail.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-order-rules
// Author : Gerrah
// Purpose : Beside the open step: how it reads as one sentence, where it sits
// in the flow (the steps that come first and the ones that come after it,
// solid when something has to happen first, dashed when it's only the order),
// and the checks: this step's problems with a fix where there is one, the
// other steps' problems with a link to each, or what passed.

import { Button } from "@/shared/components/Button/Button";
import { Icon } from "@/shared/icons/Icon";
import { linksOf, locks, readsAs, type StepLink } from "../model/orderRules";
import { OrderRulesText as RuleText } from "../model/orderRulesContent";
import type { WorkflowProblems } from "../model/workflowChecks";
import type { DueOffset, WorkflowStep } from "../types/workflowTypes";
import type { StepEditorOptions } from "./StepEditor";
import { whoInWords } from "./giveToOptions";
import { OrderFieldText, StepRailText as Text } from "./workflowsContent";
import styles from "./StepRail.module.css";

interface StepRailProps {
  /** Every step, in due order. */
  steps: readonly WorkflowStep[];
  step: WorkflowStep;
  problems: WorkflowProblems;
  options: StepEditorOptions;
  onFixDue: (due: DueOffset) => void;
  onOpen: (stepId: string) => void;
  readOnly?: boolean;
}

function FlowLinks({
  title,
  links,
  onOpen,
}: {
  title: string;
  links: readonly StepLink[];
  onOpen: (stepId: string) => void;
}) {
  if (links.length === 0) return null;
  return (
    <div className={styles.group}>
      <h3 className={styles.groupTitle}>{title}</h3>
      <ul className={styles.links}>
        {links.map((link) => {
          const hard = locks(link.condition);
          return (
            <li key={`${link.otherId}-${link.incoming}`}>
              <button
                type="button"
                className={styles.link}
                data-kind={hard ? "hard" : "soft"}
                onClick={() => onOpen(link.otherId)}
                aria-label={Text.open(link.name)}
              >
                <span className={styles.linkName}>{link.name}</span>
                <span className={styles.linkMeta}>
                  {hard ? RuleText.condition[link.condition] : Text.onlyOrder}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function StepRail({
  steps,
  step,
  problems,
  options,
  onFixDue,
  onOpen,
  readOnly = false,
}: StepRailProps) {
  const sentence = readsAs(steps, step, {
    who: whoInWords(step, options),
    clockFormat: options.clockFormat,
    untitled: OrderFieldText.untitled,
  });
  const links = linksOf(steps, step.id, OrderFieldText.untitled);
  const before = links.filter((link) => link.incoming);
  const after = links.filter((link) => !link.incoming);
  const own = problems.steps[step.id]?.order ?? [];
  const elsewhere = steps.filter(
    (entry) =>
      entry.id !== step.id && (problems.steps[entry.id]?.order.length ?? 0) > 0,
  );

  return (
    <aside className={styles.rail} aria-label={Text.label}>
      <section className={styles.card} aria-labelledby="rail-reads-as">
        <h2 id="rail-reads-as" className={styles.title}>
          {Text.readsAs}
        </h2>
        <p className={styles.sentence}>
          {sentence.map((part, index) =>
            part.bold ? <b key={index}>{part.text}</b> : part.text,
          )}
        </p>
      </section>

      <section className={styles.card} aria-labelledby="rail-flow">
        <h2 id="rail-flow" className={styles.title}>
          {Text.inFlow}
        </h2>
        {links.length === 0 ? (
          <p className={styles.muted}>{Text.noLinks}</p>
        ) : (
          <>
            <FlowLinks title={Text.comesFirst} links={before} onOpen={onOpen} />
            <FlowLinks title={Text.comesAfter} links={after} onOpen={onOpen} />
            <p className={styles.legend}>
              <span className={styles.key} data-kind="hard" aria-hidden />
              {Text.hasToHappen}
              <span className={styles.key} data-kind="soft" aria-hidden />
              {Text.onlyOrder}
            </p>
          </>
        )}
      </section>

      <section className={styles.card} aria-labelledby="rail-checks">
        <h2 id="rail-checks" className={styles.title}>
          {Text.checks}
        </h2>
        {own.length === 0 && elsewhere.length === 0 ? (
          <ul className={styles.passing}>
            {Text.passing.map((line) => (
              <li key={line}>
                <Icon name="check" />
                {line}
              </li>
            ))}
          </ul>
        ) : null}
        {own.map((problem, index) => (
          <div key={index} className={styles.problem} role="alert">
            <p className={styles.problemText}>{problem.message}</p>
            {problem.fix && !readOnly ? (
              <Button size="small" onClick={() => onFixDue(problem.fix!)}>
                {Text.fix}
              </Button>
            ) : null}
          </div>
        ))}
        {elsewhere.length > 0 ? (
          <div className={styles.group}>
            <h3 className={styles.groupTitle}>{Text.elsewhere}</h3>
            <ul className={styles.links}>
              {elsewhere.map((entry) => {
                const index = steps.indexOf(entry);
                const name = `${index + 1}. ${entry.title.trim() || OrderFieldText.untitled(index)}`;
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      className={styles.link}
                      data-kind="problem"
                      onClick={() => onOpen(entry.id)}
                    >
                      <span className={styles.linkName}>{name}</span>
                      <span className={styles.linkMeta}>
                        {problems.steps[entry.id]?.order[0]?.message}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </section>
    </aside>
  );
}

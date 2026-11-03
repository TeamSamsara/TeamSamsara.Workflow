// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/GapsCard.tsx
// Version : 1.2.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : The event details a workflow uses: the {gaps} in its tasks' text,
// split into those the event fills itself and those asked for when planning.

import { useFields } from "@/features/fields";
import { Chip } from "@/shared/components/Chip/Chip";
import { HelpTip } from "@/shared/components/HelpTip/HelpTip";
import { workflowGaps } from "../model/placeholders";
import type { WorkflowStep } from "../types/workflowTypes";
import { GapsCardText as Text } from "./workflowsContent";
import styles from "./WorkflowSideCards.module.css";

export function GapsCard({ steps }: { steps: readonly WorkflowStep[] }) {
  const gaps = workflowGaps(steps);
  const fields = useFields();
  const unknown = gaps.asked.filter(
    (gap) => fields.status === "ready" && !fields.byKey(gap),
  );
  const none = gaps.fromEvent.length === 0 && gaps.asked.length === 0;

  return (
    <section className={styles.card} aria-labelledby="workflow-gaps-title">
      <div className={styles.heading}>
        <h2 id="workflow-gaps-title" className={styles.title}>
          {Text.title}
        </h2>
        <HelpTip topic={Text.title}>{Text.help}</HelpTip>
      </div>
      {none ? <p className={styles.muted}>{Text.none}</p> : null}
      {gaps.fromEvent.length > 0 ? (
        <div className={styles.group}>
          <h3 className={styles.groupTitle}>{Text.fromEvent}</h3>
          <div className={styles.chips}>
            {gaps.fromEvent.map((gap) => (
              <Chip key={gap} label={`{${gap}}`} variant="outline" />
            ))}
          </div>
        </div>
      ) : null}
      {gaps.asked.length > 0 ? (
        <div className={styles.group}>
          <h3 className={styles.groupTitle}>{Text.asked}</h3>
          <div className={styles.chips}>
            {gaps.asked.map((gap) => (
              <Chip
                key={gap}
                label={fields.byKey(gap)?.name ?? `{${gap}}`}
                variant="outline"
              />
            ))}
          </div>
          {unknown.length > 0 ? (
            <p className={styles.small}>
              {unknown.map((gap) => `{${gap}}`).join(", ")}: {Text.notAField}
            </p>
          ) : null}
        </div>
      ) : null}
      <p className={styles.small}>{Text.builtIn}</p>
    </section>
  );
}

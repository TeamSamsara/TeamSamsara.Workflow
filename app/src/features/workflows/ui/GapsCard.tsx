// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/GapsCard.tsx
// Version : 1.1.0
// Latest commit: fix/workflow-editor-simpler
// Author : Gerrah
// Purpose : The event details a workflow uses: the {gaps} in its tasks' text,
// split into those the event fills itself and those asked for when planning.

import { Chip } from "@/shared/components/Chip/Chip";
import { HelpTip } from "@/shared/components/HelpTip/HelpTip";
import { workflowGaps } from "../model/placeholders";
import type { WorkflowStep } from "../types/workflowTypes";
import { GapsCardText as Text } from "./workflowsContent";
import styles from "./WorkflowSideCards.module.css";

export function GapsCard({ steps }: { steps: readonly WorkflowStep[] }) {
  const gaps = workflowGaps(steps);
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
              <Chip key={gap} label={`{${gap}}`} variant="outline" />
            ))}
          </div>
        </div>
      ) : null}
      <p className={styles.small}>{Text.builtIn}</p>
    </section>
  );
}

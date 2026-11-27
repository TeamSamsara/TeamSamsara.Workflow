// File : /TeamSamsara.Workflow/app/src/features/workload/ui/WeekLegend.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-workload
// Author : Gerrah
// Purpose : What each week word means, for Settings → General.

import type { WeekState } from "@engine/workload";
import { WeekPill } from "./WeekPill";
import { WorkloadText as Text, WeekStateText } from "./workloadContent";
import styles from "./Workload.module.css";

const states: WeekState[] = ["available", "limited", "atCapacity", "over"];

export function WeekLegend() {
  return (
    <div className={styles.list}>
      <h4 className={styles.subheading}>{Text.legendTitle}</h4>
      <dl className={styles.legend}>
        {states.map((state) => (
          <div key={state} style={{ display: "contents" }}>
            <dt>
              <WeekPill state={state} />
            </dt>
            <dd>{WeekStateText[state].meaning}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.muted}>{Text.legendNote}</p>
    </div>
  );
}

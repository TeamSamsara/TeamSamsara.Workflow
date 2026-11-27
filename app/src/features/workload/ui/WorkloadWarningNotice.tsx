// File : /TeamSamsara.Workflow/app/src/features/workload/ui/WorkloadWarningNotice.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-workload-c
// Author : Gerrah
// Purpose : The warning when an event's tasks would push a group over its
// usual week: which group, which week, and how it stood before. It never
// stops the event being created.

import { useWorkspaceRecord } from "@/core/workspace";
import { Banner } from "@/shared/components/Banner/Banner";
import type { WorkloadWarning } from "../model/warnings";
import { WarningText as Text } from "./workloadContent";
import styles from "./Workload.module.css";

interface WorkloadWarningNoticeProps {
  warnings: readonly WorkloadWarning[];
  groupName: (groupId: string) => string;
}

export function WorkloadWarningNotice({
  warnings,
  groupName,
}: WorkloadWarningNoticeProps) {
  const workspace = useWorkspaceRecord();
  if (warnings.length === 0) return null;
  return (
    <Banner tone="alert" icon="warning">
      <span className={styles.warning}>
        <b>{Text.title}</b>
        {warnings.map((warning) => {
          const name = groupName(warning.groupId);
          const week = new Intl.DateTimeFormat("en-US", {
            timeZone: workspace.timeZone,
            month: "short",
            day: "numeric",
          }).format(warning.weekStart);
          return (
            <span key={`${warning.groupId}-${week}`}>
              {Text.over(name, week)}
              {warning.before === "available"
                ? ""
                : ` ${Text.already(name, warning.before)}`}
            </span>
          );
        })}
        <span>{Text.still}</span>
      </span>
    </Banner>
  );
}

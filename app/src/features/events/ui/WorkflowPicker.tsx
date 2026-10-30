// File : /TeamSamsara.Workflow/app/src/features/events/ui/WorkflowPicker.tsx
// Version : 1.0.0
// Latest commit: feature/calendar-events
// Author : Gerrah
// Purpose : Which workflows to apply to a new event: one tick each, with how
// many tasks it adds and which groups; the ones made for the event's type
// come first, marked as suggested.

import type { WorkGroupRecord } from "@/features/work-groups";
import type { WorkflowRecord } from "@/features/workflows";
import { Checkbox } from "@/shared/components/Fields/Checkbox/Checkbox";
import { EventLimits } from "../types/eventTypes";
import { WorkflowPickerText as Text } from "./eventsContent";
import styles from "./EventPanels.module.css";

interface WorkflowPickerProps {
  workflows: readonly WorkflowRecord[];
  selectedIds: readonly string[];
  onChange: (ids: string[]) => void;
  eventTypeId: string | null;
  groups: readonly WorkGroupRecord[];
}

export function WorkflowPicker({
  workflows,
  selectedIds,
  onChange,
  eventTypeId,
  groups,
}: WorkflowPickerProps) {
  const isSuggested = (workflow: WorkflowRecord) =>
    eventTypeId !== null && workflow.eventTypeId === eventTypeId;
  const ordered = [...workflows].sort(
    (a, b) =>
      Number(isSuggested(b)) - Number(isSuggested(a)) ||
      a.name.localeCompare(b.name),
  );
  const full = selectedIds.length >= EventLimits.workflows;

  return (
    <section className={styles.card} aria-labelledby="workflow-picker">
      <h2 id="workflow-picker" className={styles.title}>
        {Text.title}
      </h2>
      <p className={styles.muted}>{Text.description}</p>
      {ordered.length === 0 ? (
        <p className={styles.muted}>{Text.none}</p>
      ) : null}
      <ul className={styles.list}>
        {ordered.map((workflow) => {
          const checked = selectedIds.includes(workflow.id);
          const groupNames = groups
            .filter((group) =>
              workflow.steps.some((step) => step.workGroupId === group.id),
            )
            .map((group) => group.name);
          return (
            <li key={workflow.id}>
              <Checkbox
                label={workflow.name}
                description={[
                  Text.tasks(workflow.steps.length),
                  ...groupNames,
                  isSuggested(workflow) ? Text.suggested : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                checked={checked}
                disabled={!checked && full}
                onChange={(event) =>
                  onChange(
                    event.target.checked
                      ? [...selectedIds, workflow.id]
                      : selectedIds.filter((id) => id !== workflow.id),
                  )
                }
              />
            </li>
          );
        })}
      </ul>
      {full ? (
        <p className={styles.muted}>{Text.max(EventLimits.workflows)}</p>
      ) : null}
    </section>
  );
}

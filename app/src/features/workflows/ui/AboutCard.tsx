// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/AboutCard.tsx
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : A workflow's name, what it's for, and the event type it's
// suggested for when planning.

import type { ColouredItem } from "@/core/data";
import { Select } from "@/shared/components/Fields/Select/Select";
import { TextArea } from "@/shared/components/Fields/TextArea/TextArea";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { TextLimits } from "@/shared/validation/textLimits";
import { WorkflowLimits, type WorkflowFields } from "../types/workflowTypes";
import { AboutCardText as Text } from "./workflowsContent";
import styles from "./WorkflowSideCards.module.css";

interface AboutCardProps {
  fields: WorkflowFields;
  onChange: (changes: Partial<WorkflowFields>) => void;
  eventTypes: readonly ColouredItem[];
  nameError?: string;
  descriptionError?: string;
}

export function AboutCard({
  fields,
  onChange,
  eventTypes,
  nameError,
  descriptionError,
}: AboutCardProps) {
  const eventTypeOptions = [
    { value: "", label: Text.anyEvent },
    ...eventTypes.map((type) => ({ value: type.id, label: type.name })),
  ];

  return (
    <section className={styles.card} aria-labelledby="workflow-about-title">
      <h2 id="workflow-about-title" className={styles.title}>
        {Text.title}
      </h2>
      <div className={styles.fields}>
        <TextField
          label={Text.name}
          placeholder={Text.namePlaceholder}
          value={fields.name}
          maxLength={TextLimits.name}
          onChange={(event) => onChange({ name: event.target.value })}
          error={nameError}
        />
        <TextArea
          label={Text.description}
          placeholder={Text.descriptionPlaceholder}
          value={fields.description}
          rows={3}
          maxLength={WorkflowLimits.description}
          onChange={(event) => onChange({ description: event.target.value })}
          error={descriptionError}
        />
        <Select
          label={Text.eventType}
          options={eventTypeOptions}
          value={fields.eventTypeId ?? ""}
          onChange={(event) =>
            onChange({ eventTypeId: event.target.value || null })
          }
          hint={
            eventTypes.length === 0 ? Text.noEventTypes : Text.eventTypeHint
          }
        />
      </div>
    </section>
  );
}

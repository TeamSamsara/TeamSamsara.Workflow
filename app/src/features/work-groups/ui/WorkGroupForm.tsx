// File : /TeamSamsara.Workflow/app/src/features/work-groups/ui/WorkGroupForm.tsx
// Version : 1.1.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : A work group's name and "what this group does" fields.

import { TextArea } from "@/shared/components/Fields/TextArea/TextArea";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { TextLimits } from "@/shared/validation/textLimits";
import type { WorkGroupFields } from "../types/workGroupTypes";
import { WorkGroupFormText } from "./workGroupsContent";
import styles from "./WorkGroupForm.module.css";

interface WorkGroupFormProps {
  fields: Pick<WorkGroupFields, "name" | "description">;
  onChange: (changes: Partial<WorkGroupFields>) => void;
  nameError?: string;
  disabled?: boolean;
  /** Put the cursor in the name field straight away (in a dialog). */
  autoFocusName?: boolean;
}

export function WorkGroupForm({
  fields,
  onChange,
  nameError,
  disabled = false,
  autoFocusName = false,
}: WorkGroupFormProps) {
  return (
    <div className={styles.form}>
      <TextField
        label={WorkGroupFormText.name}
        value={fields.name}
        maxLength={TextLimits.name}
        onChange={(event) => onChange({ name: event.target.value })}
        error={nameError}
        disabled={disabled}
        className={styles.name}
        autoFocus={autoFocusName}
      />
      <TextArea
        label={WorkGroupFormText.description}
        value={fields.description}
        maxLength={TextLimits.description}
        rows={2}
        onChange={(event) => onChange({ description: event.target.value })}
        hint={WorkGroupFormText.descriptionHint}
        disabled={disabled}
      />
    </div>
  );
}

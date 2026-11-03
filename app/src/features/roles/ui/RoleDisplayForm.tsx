// File : /TeamSamsara.Workflow/app/src/features/roles/ui/RoleDisplayForm.tsx
// Version : 1.1.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : A role's Display tab fields: name, colour and description, with a
// preview of how a member's name and chip look in that colour.

import type { CSSProperties } from "react";
import { Avatar } from "@/shared/components/Avatar/Avatar";
import { ColorPicker } from "@/shared/components/Fields/ColorPicker/ColorPicker";
import { TextArea } from "@/shared/components/Fields/TextArea/TextArea";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { TextLimits } from "@/shared/validation/textLimits";
import type { RoleFields } from "../types/roleTypes";
import { RoleChip } from "./RoleChip";
import { RoleDisplayFormText } from "./roleDisplayFormContent";
import styles from "./RoleDisplayForm.module.css";

interface RoleDisplayFormProps {
  fields: RoleFields;
  onChange: (changes: Partial<Omit<RoleFields, "permissions">>) => void;
  nameError?: string;
  disabled?: boolean;
}

export function RoleDisplayForm({
  fields,
  onChange,
  nameError,
  disabled = false,
}: RoleDisplayFormProps) {
  const previewRole = { name: fields.name.trim() || "—", color: fields.color };

  return (
    <div className={styles.form}>
      <TextField
        label={RoleDisplayFormText.name}
        value={fields.name}
        maxLength={TextLimits.name}
        onChange={(event) => onChange({ name: event.target.value })}
        error={nameError}
        disabled={disabled}
      />
      <ColorPicker
        value={fields.color}
        onChange={(color) => onChange({ color })}
        hint={RoleDisplayFormText.colorHint}
        disabled={disabled}
      />
      <TextArea
        label={RoleDisplayFormText.description}
        value={fields.description}
        maxLength={TextLimits.description}
        rows={2}
        onChange={(event) => onChange({ description: event.target.value })}
        hint={RoleDisplayFormText.descriptionHint}
        disabled={disabled}
      />
      <div className={styles.preview} aria-hidden="true">
        <span className={styles.previewLabel}>
          {RoleDisplayFormText.preview}
        </span>
        <div className={styles.previewRow}>
          <Avatar name={RoleDisplayFormText.previewName} />
          <div className={styles.previewText}>
            <span className={styles.previewTop}>
              <b
                className={styles.previewName}
                style={{ "--role-color": fields.color } as CSSProperties}
              >
                {RoleDisplayFormText.previewName}
              </b>
              <RoleChip role={previewRole} />
            </span>
            <span className={styles.previewDetail}>
              {RoleDisplayFormText.previewDetail}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

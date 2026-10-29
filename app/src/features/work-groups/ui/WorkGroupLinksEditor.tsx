// File : /TeamSamsara.Workflow/app/src/features/work-groups/ui/WorkGroupLinksEditor.tsx
// Version : 1.0.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : Edits a work group's links: a name and an address per row (e.g.
// Shared drive → https://drive.google.com/…), with Open, Remove and Add link.
// The rows are part of the group's draft, saved with the rest.

import { IconButton } from "@/shared/components/Button/IconButton";
import { Button } from "@/shared/components/Button/Button";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { TextLimits } from "@/shared/validation/textLimits";
import { WorkGroupLimits, type WorkGroupLink } from "../types/workGroupTypes";
import { WorkGroupLinksText as Text } from "./workGroupsContent";
import styles from "./WorkGroupLinksEditor.module.css";

interface WorkGroupLinksEditorProps {
  links: readonly WorkGroupLink[];
  errors: readonly (string | undefined)[];
  onChange: (links: WorkGroupLink[]) => void;
  /** Show the problems (once the person has tried to save). */
  showErrors: boolean;
  disabled?: boolean;
}

export function WorkGroupLinksEditor({
  links,
  errors,
  onChange,
  showErrors,
  disabled = false,
}: WorkGroupLinksEditorProps) {
  function update(index: number, changes: Partial<WorkGroupLink>) {
    onChange(
      links.map((link, at) => (at === index ? { ...link, ...changes } : link)),
    );
  }

  return (
    <div className={styles.editor}>
      {links.length === 0 ? <p className={styles.muted}>{Text.none}</p> : null}
      {links.map((link, index) => (
        <div key={index} className={styles.row}>
          <TextField
            label={Text.label}
            hideLabel={index > 0}
            value={link.label}
            placeholder={Text.labelPlaceholder}
            maxLength={TextLimits.name}
            onChange={(event) => update(index, { label: event.target.value })}
            disabled={disabled}
            className={styles.label}
          />
          <TextField
            label={Text.url}
            hideLabel={index > 0}
            type="url"
            inputMode="url"
            value={link.url}
            placeholder={Text.urlPlaceholder}
            onChange={(event) => update(index, { url: event.target.value })}
            error={showErrors ? errors[index] : undefined}
            disabled={disabled}
            className={styles.url}
          />
          <div className={styles.rowActions} data-first={index === 0}>
            <IconButton
              icon="externalLink"
              label={Text.open(link.label)}
              variant="ghost"
              disabled={!link.url.trim() || Boolean(errors[index])}
              onClick={() =>
                window.open(link.url.trim(), "_blank", "noopener,noreferrer")
              }
            />
            <IconButton
              icon="trash"
              label={Text.remove(link.label)}
              variant="ghost"
              disabled={disabled}
              onClick={() =>
                onChange(links.filter((_link, at) => at !== index))
              }
            />
          </div>
        </div>
      ))}
      <Button
        size="small"
        iconStart="add"
        onClick={() => onChange([...links, { label: "", url: "" }])}
        disabled={disabled || links.length >= WorkGroupLimits.links}
        className={styles.add}
      >
        {Text.add}
      </Button>
    </div>
  );
}

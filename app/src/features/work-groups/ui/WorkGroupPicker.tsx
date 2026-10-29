// File : /TeamSamsara.Workflow/app/src/features/work-groups/ui/WorkGroupPicker.tsx
// Version : 1.1.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : Picks work groups as a row of pill-shaped checkboxes. Used when
// inviting a member, on a member's page, and when giving a task to groups.

import type { WorkGroupRecord } from "../types/workGroupTypes";
import { WorkGroupPickerText } from "./workGroupsContent";
import styles from "./WorkGroupPicker.module.css";

interface WorkGroupPickerProps {
  groups: readonly WorkGroupRecord[];
  selectedIds: readonly string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
  /** Leave out the hint under the pills. */
  hideHint?: boolean;
  /** Inside a card already titled "Work groups": the label is for screen readers only. */
  hideLegend?: boolean;
}

export function WorkGroupPicker({
  groups,
  selectedIds,
  onChange,
  disabled = false,
  hideHint = false,
  hideLegend = false,
}: WorkGroupPickerProps) {
  function toggle(groupId: string, on: boolean) {
    const next = on
      ? [...selectedIds, groupId]
      : selectedIds.filter((id) => id !== groupId);
    onChange(groups.map((group) => group.id).filter((id) => next.includes(id)));
  }

  return (
    <fieldset className={styles.picker} disabled={disabled}>
      <legend className={hideLegend ? styles.hiddenLegend : styles.legend}>
        {WorkGroupPickerText.legend}
      </legend>
      {groups.length === 0 ? (
        <p className={styles.hint}>{WorkGroupPickerText.none}</p>
      ) : (
        <div className={styles.pills}>
          {groups.map((group) => (
            <label key={group.id} className={styles.pill}>
              <input
                type="checkbox"
                className={styles.input}
                checked={selectedIds.includes(group.id)}
                onChange={(event) => toggle(group.id, event.target.checked)}
              />
              {group.name}
            </label>
          ))}
        </div>
      )}
      {hideHint ? null : (
        <p className={styles.hint}>{WorkGroupPickerText.hint}</p>
      )}
    </fieldset>
  );
}

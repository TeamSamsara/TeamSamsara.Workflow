// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/TagPicker.tsx
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : A task's tags as chips, with a menu to add more from the
// workspace's tags.

import type { ColouredItem } from "@/core/data";
import { TagChip } from "@/features/task-setup";
import { ButtonContent } from "@/shared/components/Button/ButtonContent";
import { buttonLook } from "@/shared/components/Button/buttonLook";
import { Dropdown } from "@/shared/components/Dropdown/Dropdown";
import { DropdownItem } from "@/shared/components/Dropdown/DropdownItem";
import { DropdownPanel } from "@/shared/components/Dropdown/DropdownPanel";
import { DropdownTrigger } from "@/shared/components/Dropdown/DropdownTrigger";
import { WorkflowLimits } from "../types/workflowTypes";
import { StepEditorText as Text } from "./workflowsContent";
import styles from "./StepEditor.module.css";

interface TagPickerProps {
  tagIds: readonly string[];
  tags: readonly ColouredItem[];
  onChange: (tagIds: string[]) => void;
  readOnly?: boolean;
}

export function TagPicker({
  tagIds,
  tags,
  onChange,
  readOnly = false,
}: TagPickerProps) {
  const chosen = tagIds.flatMap((id) => tags.filter((tag) => tag.id === id));
  const available = tags.filter((tag) => !tagIds.includes(tag.id));
  const canAdd = available.length > 0 && tagIds.length < WorkflowLimits.tags;

  return (
    <div className={styles.group} role="group" aria-label={Text.tags}>
      <span className={styles.groupLabel}>{Text.tags}</span>
      <div className={styles.chips}>
        {chosen.map((tag) => (
          <TagChip
            key={tag.id}
            item={tag}
            onRemove={
              readOnly
                ? undefined
                : () => onChange(tagIds.filter((id) => id !== tag.id))
            }
          />
        ))}
        {readOnly ? (
          chosen.length === 0 ? (
            <span className={styles.muted}>{Text.noTagsOnTask}</span>
          ) : null
        ) : tags.length === 0 ? (
          <span className={styles.muted}>{Text.noTags}</span>
        ) : canAdd ? (
          <Dropdown>
            <DropdownTrigger
              popup="menu"
              {...buttonLook("ghost", "small", false)}
            >
              <ButtonContent iconStart="add">{Text.addTag}</ButtonContent>
            </DropdownTrigger>
            <DropdownPanel role="menu" aria-label={Text.addTag}>
              {available.map((tag) => (
                <DropdownItem
                  key={tag.id}
                  role="menuitem"
                  onSelect={() => onChange([...tagIds, tag.id])}
                >
                  <TagChip item={tag} />
                </DropdownItem>
              ))}
            </DropdownPanel>
          </Dropdown>
        ) : null}
      </div>
    </div>
  );
}

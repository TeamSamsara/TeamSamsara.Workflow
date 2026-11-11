// File : /TeamSamsara.Workflow/app/src/features/people-tags/ui/TagEditor.tsx
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : A member's people tags as pills: ticked ones solid with their
// colour, the rest dashed with a +. For people with Tag people, a click puts a
// tag on or takes it off and saves straight away; others just see the ticked
// ones.

import { useMutation } from "@tanstack/react-query";
import type { CSSProperties } from "react";
import { dataErrorMessage, type ColouredItem } from "@/core/data";
import { useToast } from "@/shared/components/Toast/useToast";
import { Icon } from "@/shared/icons/Icon";
import { setMemberTags } from "../service/peopleTagService";
import { PeopleTagsText as Text } from "./peopleTagsContent";
import styles from "./PeopleTags.module.css";

interface TagEditorProps {
  memberId: string;
  /** Their name, for the buttons' labels. */
  name: string;
  tagIds: readonly string[];
  tags: readonly ColouredItem[];
  /** Whether this person may change them. */
  canEdit: boolean;
  /** Smaller pills, for rows in a list. */
  compact?: boolean;
}

export function TagEditor({
  memberId,
  name,
  tagIds,
  tags,
  canEdit,
  compact = false,
}: TagEditorProps) {
  const toast = useToast();
  const save = useMutation({
    mutationFn: (next: string[]) => setMemberTags(memberId, next),
    onError: (error) =>
      toast.show({
        tone: "error",
        title: Text.saveFailed,
        detail: dataErrorMessage(error),
      }),
  });
  // Shown as they'll be once saved, so a click answers straight away.
  const current = save.isPending && save.variables ? save.variables : tagIds;
  const shown = canEdit ? tags : tags.filter((tag) => current.includes(tag.id));

  if (shown.length === 0)
    return (
      <span className={styles.none}>
        {canEdit ? Text.noTagsYet : Text.noTags}
      </span>
    );

  return (
    <div className={styles.pills} data-compact={compact || undefined}>
      {shown.map((tag) => {
        const on = current.includes(tag.id);
        const style = { "--tag-color": tag.color } as CSSProperties;
        if (!canEdit)
          return (
            <span key={tag.id} className={styles.pill} data-on style={style}>
              <span className={styles.dot} aria-hidden="true" />
              {tag.name}
            </span>
          );
        return (
          <button
            key={tag.id}
            type="button"
            className={styles.pill}
            data-on={on || undefined}
            style={style}
            aria-pressed={on}
            aria-label={Text.toggle(tag.name, name)}
            onClick={() =>
              save.mutate(
                on
                  ? current.filter((id) => id !== tag.id)
                  : [...current, tag.id],
              )
            }
          >
            {on ? (
              <span className={styles.dot} aria-hidden="true" />
            ) : (
              <Icon name="add" className={styles.plus} />
            )}
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}

// File : /TeamSamsara.Workflow/app/src/features/task-setup/ui/SetupListCard.tsx
// Version : 1.0.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : A card holding one of the workspace's lists (statuses, event types,
// tags): a heading with its Add button, rows you drag (or move with the arrow
// keys) to reorder, and an edit button per row. What each row shows is up to
// the caller.

import type { ReactNode } from "react";
import { Button } from "@/shared/components/Button/Button";
import { IconButton } from "@/shared/components/Button/IconButton";
import { useSortableList } from "@/shared/hooks/useSortableList";
import { Icon } from "@/shared/icons/Icon";
import { SetupListText } from "./taskSetupContent";
import styles from "./SetupListCard.module.css";

interface SetupListItem {
  id: string;
  name: string;
}

interface SetupListCardProps<TItem extends SetupListItem> {
  title: string;
  description: string;
  addLabel: string;
  items: readonly TItem[];
  /** The main part of a row (a pill, a coloured name…). */
  renderLabel: (item: TItem) => ReactNode;
  /** The muted detail beside it, if any. */
  renderDetail?: (item: TItem) => ReactNode;
  onAdd: () => void;
  onEdit: (item: TItem) => void;
  onReorder: (orderedIds: string[]) => void;
  isSavingOrder?: boolean;
  /** Shown instead of the rows when the list is empty. */
  empty?: ReactNode;
  /** For members without Manage settings: no Add, edit or dragging. */
  readOnly?: boolean;
}

export function SetupListCard<TItem extends SetupListItem>({
  title,
  description,
  addLabel,
  items,
  renderLabel,
  renderDetail,
  onAdd,
  onEdit,
  onReorder,
  isSavingOrder = false,
  empty,
  readOnly = false,
}: SetupListCardProps<TItem>) {
  const sortable = useSortableList({
    ids: items.map((item) => item.id),
    disabled: isSavingOrder || readOnly,
    onReorder,
  });

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.muted}>{description}</p>
        </div>
        {readOnly ? null : (
          <Button size="small" iconStart="add" onClick={onAdd}>
            {addLabel}
          </Button>
        )}
      </header>

      {items.length === 0 ? (
        <div className={styles.empty}>{empty}</div>
      ) : (
        <ol className={styles.list} aria-label={title}>
          {items.map((item, index) => (
            <li
              key={item.id}
              className={styles.row}
              {...(readOnly ? {} : sortable.rowProps(item.id, index))}
            >
              {readOnly ? null : (
                <button
                  type="button"
                  className={styles.handle}
                  aria-label={SetupListText.move(item.name)}
                  {...sortable.handleProps(item.id, index)}
                >
                  <Icon name="dragHandle" />
                </button>
              )}
              <span className={styles.label}>{renderLabel(item)}</span>
              {renderDetail ? (
                <span className={styles.detail}>{renderDetail(item)}</span>
              ) : null}
              {readOnly ? null : (
                <IconButton
                  icon="edit"
                  label={SetupListText.edit(item.name)}
                  variant="ghost"
                  size="small"
                  onClick={() => onEdit(item)}
                />
              )}
            </li>
          ))}
        </ol>
      )}

      {items.length > 1 && !readOnly ? (
        <p className={styles.muted} aria-live="polite">
          {isSavingOrder ? SetupListText.saving : SetupListText.dragHint}
        </p>
      ) : null}
    </section>
  );
}

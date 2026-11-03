// File : /TeamSamsara.Workflow/app/src/features/roles/ui/RoleList.tsx
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : The ordered list of roles, highest first, with Everyone set apart at
// the bottom. Each row shows the colour, name and member count and opens the
// role; rows you may manage have a handle to drag them, or move them with the
// arrow keys. Roles at or above your own stay put.

import type { CSSProperties } from "react";
import { NavLink } from "react-router-dom";
import { classNames } from "@/lib/classNames";
import { Button } from "@/shared/components/Button/Button";
import { useSortableList } from "@/shared/hooks/useSortableList";
import { Icon } from "@/shared/icons/Icon";
import type { RoleListItem } from "../types/roleTypes";
import { RoleListText } from "./roleListContent";
import styles from "./RoleList.module.css";

interface RoleListProps {
  /** Every role, top first, Everyone last. */
  items: readonly RoleListItem[];
  firstMovableIndex: number;
  hrefFor: (roleId: string) => string;
  onReorder: (orderedIds: string[]) => void;
  isSaving?: boolean;
  onNewRole?: () => void;
  className?: string;
}

const dotStyle = (color: string) =>
  ({ "--role-color": color }) as CSSProperties;

function countLabel(item: RoleListItem): string {
  if (item.isEveryone) return RoleListText.everyoneCount;
  return item.memberCount === null ? "" : String(item.memberCount);
}

export function RoleList({
  items,
  firstMovableIndex,
  hrefFor,
  onReorder,
  isSaving = false,
  onNewRole,
  className,
}: RoleListProps) {
  const ordered = items.filter((item) => !item.isEveryone);
  const everyone = items.find((item) => item.isEveryone);
  const sortable = useSortableList({
    ids: ordered.map((item) => item.role.id),
    firstMovableIndex,
    disabled: isSaving,
    onReorder,
  });

  return (
    <section className={classNames(styles.card, className)}>
      <header className={styles.header}>
        <h2 className={styles.title}>{RoleListText.title}</h2>
        {onNewRole ? (
          <Button size="small" iconStart="add" onClick={onNewRole}>
            {RoleListText.newRole}
          </Button>
        ) : null}
      </header>

      <ol className={styles.list} aria-label={RoleListText.label}>
        {ordered.map((item, index) => {
          const movable = sortable.isMovable(index);
          const count = countLabel(item);
          return (
            <li
              key={item.role.id}
              className={styles.item}
              {...sortable.rowProps(item.role.id, index)}
            >
              {movable ? (
                <button
                  type="button"
                  className={styles.handle}
                  aria-label={RoleListText.move(item.role.name)}
                  {...sortable.handleProps(item.role.id, index)}
                >
                  <Icon name="dragHandle" />
                </button>
              ) : (
                <span
                  className={styles.lock}
                  title={RoleListText.locked(item.role.name)}
                >
                  <Icon name="lock" />
                </span>
              )}
              <NavLink to={hrefFor(item.role.id)} className={styles.link}>
                <span
                  className={styles.dot}
                  style={dotStyle(item.role.color)}
                  aria-hidden="true"
                />
                <span className={styles.name}>{item.role.name}</span>
                {count ? (
                  <span
                    className={styles.count}
                    aria-label={
                      item.memberCount === null
                        ? undefined
                        : RoleListText.memberCount(item.memberCount)
                    }
                  >
                    {count}
                  </span>
                ) : null}
              </NavLink>
            </li>
          );
        })}
      </ol>

      {everyone ? (
        <>
          <hr className={styles.divider} />
          <NavLink
            to={hrefFor(everyone.role.id)}
            className={classNames(styles.link, styles.everyone)}
          >
            <span
              className={styles.dot}
              style={dotStyle(everyone.role.color)}
              aria-hidden="true"
            />
            <span className={styles.name}>{everyone.role.name}</span>
            <span className={styles.count}>{RoleListText.everyoneCount}</span>
          </NavLink>
        </>
      ) : null}

      <p className={styles.hint} aria-live="polite">
        {isSaving ? RoleListText.saving : RoleListText.hint}
      </p>
    </section>
  );
}

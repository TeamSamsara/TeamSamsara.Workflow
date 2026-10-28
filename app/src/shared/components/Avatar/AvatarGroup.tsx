// File : /TeamSamsara.Workflow/app/src/shared/components/Avatar/AvatarGroup.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : A few avatars overlapping in a row, with "+3" for the rest, for the members of a
// work group. The label says who is in it, for screen readers.

import { classNames } from "@/lib/classNames";
import { Avatar, type AvatarSize } from "./Avatar";
import styles from "./Avatar.module.css";

interface AvatarGroupPerson {
  id: string;
  name: string;
  src?: string | null;
}

interface AvatarGroupProps {
  people: readonly AvatarGroupPerson[];
  /** How many avatars show before the rest become "+N". */
  max?: number;
  size?: AvatarSize;
  /** Read by screen readers, e.g. "Jordan Lee and Chris Novak". */
  label: string;
  className?: string;
}

const defaultMax = 4;

export function AvatarGroup({
  people,
  max = defaultMax,
  size = "medium",
  label,
  className,
}: AvatarGroupProps) {
  const shown = people.slice(0, max);
  const hiddenCount = people.length - shown.length;

  return (
    <span
      className={classNames(styles.group, className)}
      role="img"
      aria-label={label}
    >
      {shown.map((person) => (
        <Avatar
          key={person.id}
          name={person.name}
          src={person.src}
          size={size}
          className={styles.stacked}
        />
      ))}
      {hiddenCount > 0 ? (
        <span
          className={classNames(styles.avatar, styles.stacked)}
          data-size={size}
          aria-hidden
        >
          +{hiddenCount}
        </span>
      ) : null}
    </span>
  );
}

// File : /TeamSamsara.Workflow/app/src/shared/components/Chip/Chip.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : A small tag for a name: a work group, a task kind, a role, an email in a list.
// It can show a colour dot (a role's colour, which comes from the data) and a remove button.

import type { CSSProperties } from "react";
import { classNames } from "@/lib/classNames";
import { Icon } from "@/shared/icons/Icon";
import { ChipText } from "./chipContent";
import styles from "./Chip.module.css";

interface ChipProps {
  label: string;
  /** Colour of the dot before the label, any CSS colour. No dot when left out. */
  color?: string;
  /** tag: filled, square-ish (groups, kinds). outline: rounded with a border (roles). */
  variant?: "tag" | "outline";
  /** Shows a remove button that calls this. */
  onRemove?: () => void;
  className?: string;
}

export function Chip({
  label,
  color,
  variant = "tag",
  onRemove,
  className,
}: ChipProps) {
  const dotStyle = color
    ? ({ "--chip-dot": color } as CSSProperties)
    : undefined;

  return (
    <span
      className={classNames(styles.chip, className)}
      data-variant={variant}
      style={dotStyle}
    >
      {color ? <span className={styles.dot} aria-hidden /> : null}
      <span className={styles.label}>{label}</span>
      {onRemove ? (
        <button
          type="button"
          className={styles.remove}
          aria-label={ChipText.remove(label)}
          onClick={onRemove}
        >
          <Icon name="close" className={styles.removeIcon} />
        </button>
      ) : null}
    </span>
  );
}

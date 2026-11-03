// File : /TeamSamsara.Workflow/app/src/features/availability/ui/PersonalItem.tsx
// Version : 1.0.0
// Latest commit: feature/people-time
// Author : Gerrah
// Purpose : A personal appointment on My calendar: dashed, with a lock, since
// only its owner and managers see what it is. Opens it to change or delete.

import type { CSSProperties } from "react";
import { Icon } from "@/shared/icons/Icon";
import { VisuallyHidden } from "@/shared/components/VisuallyHidden/VisuallyHidden";
import { PersonalText as Text } from "./availabilityContent";
import styles from "./PersonalItem.module.css";

interface PersonalItemProps {
  title: string;
  time: string;
  onOpen: () => void;
  /** Where it sits in the week view. */
  layout?: CSSProperties | null;
}

export function PersonalItem({
  title,
  time,
  onOpen,
  layout,
}: PersonalItemProps) {
  return (
    <button
      type="button"
      className={styles.item}
      data-block={layout ? true : undefined}
      style={layout ?? undefined}
      onClick={onOpen}
      title={Text.private}
    >
      <span className={styles.title}>
        <Icon name="lock" className={styles.lock} />
        <VisuallyHidden>{Text.private}: </VisuallyHidden>
        {title}
      </span>
      <span className={styles.meta}>{time}</span>
    </button>
  );
}

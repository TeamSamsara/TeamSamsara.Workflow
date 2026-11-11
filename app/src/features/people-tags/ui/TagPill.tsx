// File : /TeamSamsara.Workflow/app/src/features/people-tags/ui/TagPill.tsx
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : One people tag as a small pill with its colour dot, for lists.

import type { CSSProperties } from "react";
import type { ColouredItem } from "@/core/data";
import styles from "./PeopleTags.module.css";

export function TagPill({
  tag,
}: {
  tag: Pick<ColouredItem, "name" | "color">;
}) {
  return (
    <span
      className={styles.pill}
      data-on
      data-compact
      style={{ "--tag-color": tag.color } as CSSProperties}
    >
      <span className={styles.dot} aria-hidden="true" />
      {tag.name}
    </span>
  );
}

// File : /TeamSamsara.Workflow/app/src/features/work-groups/ui/WorkGroupGrid.tsx
// Version : 1.0.0
// Latest commit: feature/work-groups
// Author : Gerrah
// Purpose : The work group cards, wrapping into as many columns as fit.

import type { WorkGroupListItem } from "../types/workGroupTypes";
import { WorkGroupCard } from "./WorkGroupCard";
import { WorkGroupCardText } from "./workGroupsContent";
import styles from "./WorkGroupCard.module.css";

interface WorkGroupGridProps {
  items: readonly WorkGroupListItem[];
  hrefFor: (groupId: string) => string;
}

export function WorkGroupGrid({ items, hrefFor }: WorkGroupGridProps) {
  return (
    <ul className={styles.grid} aria-label={WorkGroupCardText.gridLabel}>
      {items.map((item) => (
        <li key={item.group.id} className={styles.cell}>
          <WorkGroupCard item={item} to={hrefFor(item.group.id)} />
        </li>
      ))}
    </ul>
  );
}

// File : /TeamSamsara.Workflow/app/src/features/members/ui/MemberGroupsCard.tsx
// Version : 1.1.0
// Latest commit: fix/invite-and-fields
// Author : Gerrah
// Purpose : A member's work groups, picked with the work group search.

import {
  WorkGroupPicker,
  type WorkGroupListItem,
} from "@/features/work-groups";
import { MemberCardsText } from "./membersContent";
import styles from "./MemberCards.module.css";

interface MemberGroupsCardProps {
  workGroupIds: readonly string[];
  groups: readonly WorkGroupListItem[];
  onChange: (workGroupIds: string[]) => void;
  disabled?: boolean;
}

export function MemberGroupsCard({
  workGroupIds,
  groups,
  onChange,
  disabled = false,
}: MemberGroupsCardProps) {
  return (
    <section className={styles.card}>
      <h2 className={styles.title}>{MemberCardsText.groupsTitle}</h2>
      <WorkGroupPicker
        groups={groups}
        selectedIds={workGroupIds}
        onChange={onChange}
        disabled={disabled}
        hideHint
        hideLegend
      />
      <p className={styles.muted}>{MemberCardsText.groupsNote}</p>
    </section>
  );
}

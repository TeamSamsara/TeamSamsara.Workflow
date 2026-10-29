// File : /TeamSamsara.Workflow/app/src/features/members/ui/MemberGroupsCard.tsx
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : A member's work groups, picked as pills.

import { WorkGroupPicker, type WorkGroupRecord } from "@/features/work-groups";
import { MemberCardsText } from "./membersContent";
import styles from "./MemberCards.module.css";

interface MemberGroupsCardProps {
  workGroupIds: readonly string[];
  groups: readonly WorkGroupRecord[];
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

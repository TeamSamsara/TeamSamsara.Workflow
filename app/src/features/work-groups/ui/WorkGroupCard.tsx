// File : /TeamSamsara.Workflow/app/src/features/work-groups/ui/WorkGroupCard.tsx
// Version : 1.0.0
// Latest commit: feature/work-groups
// Author : Gerrah
// Purpose : One work group as a card: its name, member count, the first few
// members' avatars, and what it does. The open group is outlined in green.

import { NavLink } from "react-router-dom";
import { Avatar } from "@/shared/components/Avatar/Avatar";
import type { WorkGroupListItem } from "../types/workGroupTypes";
import { WorkGroupCardText } from "./workGroupsContent";
import styles from "./WorkGroupCard.module.css";

/** How many avatars fit before the rest become "+n". */
const avatarsShown = 4;

interface WorkGroupCardProps {
  item: WorkGroupListItem;
  to: string;
}

export function WorkGroupCard({ item, to }: WorkGroupCardProps) {
  const { group, members } = item;
  const shown = members?.slice(0, avatarsShown) ?? [];
  const hidden = (members?.length ?? 0) - shown.length;

  return (
    <NavLink to={to} className={styles.card}>
      <span className={styles.top}>
        <span className={styles.name}>{group.name}</span>
        {members ? (
          <span className={styles.meta}>
            {WorkGroupCardText.memberCount(members.length)}
          </span>
        ) : null}
      </span>
      {shown.length ? (
        <span className={styles.avatars} aria-hidden="true">
          {shown.map((member) => (
            <Avatar
              key={member.id}
              name={member.displayName || member.email}
              className={styles.avatar}
            />
          ))}
          {hidden > 0 ? (
            <span className={styles.more}>
              {WorkGroupCardText.moreMembers(hidden)}
            </span>
          ) : null}
        </span>
      ) : null}
      <span className={styles.description}>
        {group.description || WorkGroupCardText.noDescription}
      </span>
    </NavLink>
  );
}

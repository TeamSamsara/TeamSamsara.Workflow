// File : /TeamSamsara.Workflow/app/src/features/members/ui/MemberPermissionsCard.tsx
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : What a member can do, worked out from their roles (as being
// edited, so a change shows before it's saved). Read-only.

import {
  PermissionKeys,
  PermissionText,
  resolvePermissions,
} from "@/core/access";
import type { RolesRecord } from "@/core/data";
import { Icon } from "@/shared/icons/Icon";
import { VisuallyHidden } from "@/shared/components/VisuallyHidden/VisuallyHidden";
import { MemberCardsText } from "./membersContent";
import styles from "./MemberCards.module.css";

interface MemberPermissionsCardProps {
  name: string;
  roleIds: readonly string[];
  roles: RolesRecord;
}

export function MemberPermissionsCard({
  name,
  roleIds,
  roles,
}: MemberPermissionsCardProps) {
  const permissions = resolvePermissions(roleIds, roles);

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>{MemberCardsText.permissionsTitle(name)}</h2>
      <p className={styles.muted}>{MemberCardsText.permissionsNote(name)}</p>
      <ul className={styles.permissions}>
        {PermissionKeys.map((permission) => {
          const on = permissions.has(permission);
          return (
            <li key={permission} className={styles.permission} data-on={on}>
              <Icon name={on ? "check" : "close"} />
              <VisuallyHidden>
                {on ? MemberCardsText.can : MemberCardsText.cannot}
              </VisuallyHidden>
              {PermissionText[permission].label}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

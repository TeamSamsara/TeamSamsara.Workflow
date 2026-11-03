// File : /TeamSamsara.Workflow/app/src/features/members/ui/MemberRolesCard.tsx
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : A member's roles: tick the roles you may give; roles at or above
// your own show as chips you can't change, next to Everyone.

import type { RoleRecord } from "@/core/data";
import { RoleChip, RolePicker } from "@/features/roles";
import { MemberCardsText } from "./membersContent";
import styles from "./MemberCards.module.css";

interface MemberRolesCardProps {
  /** Their name, or null while they have none (the text then says "they"). */
  name: string | null;
  /** The role ids as being edited. */
  roleIds: readonly string[];
  /** Every role, top first. */
  allRoles: readonly RoleRecord[];
  /** The roles the editor may give or take away. */
  assignable: readonly RoleRecord[];
  everyone: RoleRecord | undefined;
  onChange: (roleIds: string[]) => void;
  disabled?: boolean;
}

export function MemberRolesCard({
  name,
  roleIds,
  allRoles,
  assignable,
  everyone,
  onChange,
  disabled = false,
}: MemberRolesCardProps) {
  const assignableIds = new Set(assignable.map((role) => role.id));
  const locked = allRoles.filter(
    (role) => roleIds.includes(role.id) && !assignableIds.has(role.id),
  );

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>{MemberCardsText.rolesTitle}</h2>
      {locked.length || everyone ? (
        <div className={styles.chips}>
          {locked.map((role) => (
            <RoleChip key={role.id} role={role} />
          ))}
          {everyone ? <RoleChip role={everyone} /> : null}
        </div>
      ) : null}
      <RolePicker
        roles={assignable}
        selectedIds={roleIds.filter((id) => assignableIds.has(id))}
        // The locked roles stay as they are.
        onChange={(picked) =>
          onChange([...locked.map((role) => role.id), ...picked])
        }
        disabled={disabled}
        compact
      />
      <p className={styles.muted}>{MemberCardsText.rolesNote(name)}</p>
    </section>
  );
}

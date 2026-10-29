// File : /TeamSamsara.Workflow/app/src/features/members/ui/MemberHeader.tsx
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : The top of a member's page: avatar, name, email, when they joined
// (or were invited), status, and the field to set their name. The page puts
// Reset and Save beside it.

import type { ReactNode } from "react";
import type { MemberRecord } from "@/core/data";
import { Avatar } from "@/shared/components/Avatar/Avatar";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { formatLongDate } from "@/shared/time/dates";
import { TextLimits } from "@/shared/validation/textLimits";
import { memberName } from "../types/memberTypes";
import { MemberHeaderText } from "./membersContent";
import { MemberStatusPill } from "./MemberStatusPill";
import styles from "./MemberHeader.module.css";

interface MemberHeaderProps {
  member: MemberRecord;
  /** The name as being edited. */
  displayName: string;
  onNameChange: (name: string) => void;
  nameError?: string;
  canEditName: boolean;
  timeZone: string;
  actions?: ReactNode;
}

export function MemberHeader({
  member,
  displayName,
  onNameChange,
  nameError,
  canEditName,
  timeZone,
  actions,
}: MemberHeaderProps) {
  const name = memberName({ displayName, email: member.email });
  const when = member.joinedAt
    ? MemberHeaderText.joined(formatLongDate(member.joinedAt, timeZone))
    : member.invitedAt
      ? MemberHeaderText.invited(formatLongDate(member.invitedAt, timeZone))
      : null;

  return (
    <section className={styles.card}>
      <div className={styles.top}>
        <div className={styles.identity}>
          <Avatar name={name} size="large" />
          <div className={styles.text}>
            {/* An email in the heading font would be shouted in capitals. */}
            <h2 className={styles.name} data-email={!displayName.trim()}>
              {name}
            </h2>
            <p className={styles.muted}>
              {member.email}
              {when ? ` · ${when}` : ""}
            </p>
            <span>
              <MemberStatusPill status={member.status} />
            </span>
          </div>
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      {canEditName ? (
        <TextField
          label={MemberHeaderText.name}
          value={displayName}
          placeholder={MemberHeaderText.noName}
          maxLength={TextLimits.name}
          onChange={(event) => onNameChange(event.target.value)}
          hint={MemberHeaderText.nameHint}
          error={nameError}
          className={styles.nameField}
        />
      ) : null}
    </section>
  );
}

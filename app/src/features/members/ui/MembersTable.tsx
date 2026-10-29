// File : /TeamSamsara.Workflow/app/src/features/members/ui/MembersTable.tsx
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : The members table: who they are, their roles and work groups,
// status, and when they were last active (or when the invite went out). Each
// row opens the member's page.

import { Link } from "react-router-dom";
import { RoleChip } from "@/features/roles";
import { Avatar } from "@/shared/components/Avatar/Avatar";
import { Chip } from "@/shared/components/Chip/Chip";
import { Table } from "@/shared/components/Table/Table";
import { Icon } from "@/shared/icons/Icon";
import { formatRecentDay, formatShortDate } from "@/shared/time/dates";
import { memberName, type MemberListItem } from "../types/memberTypes";
import { MembersTableText } from "./membersContent";
import { MemberStatusPill } from "./MemberStatusPill";
import styles from "./MembersTable.module.css";

/** The narrowest the table gets before it scrolls sideways. */
const tableMinWidth = 860;

interface MembersTableProps {
  items: readonly MemberListItem[];
  hrefFor: (memberId: string) => string;
  /** The workspace's time zone, for dates. */
  timeZone: string;
}

function lastSeen(item: MemberListItem, timeZone: string): string {
  const { member } = item;
  if (member.status === "invited" && member.invitedAt) {
    return MembersTableText.invitedOn(
      formatShortDate(member.invitedAt, timeZone),
    );
  }
  return formatRecentDay(member.lastActiveAt, timeZone);
}

export function MembersTable({ items, hrefFor, timeZone }: MembersTableProps) {
  if (items.length === 0) {
    return <p className={styles.empty}>{MembersTableText.none}</p>;
  }

  return (
    <Table caption={MembersTableText.caption} minWidth={tableMinWidth}>
      <thead>
        <tr>
          <th scope="col">{MembersTableText.member}</th>
          <th scope="col">{MembersTableText.roles}</th>
          <th scope="col">{MembersTableText.groups}</th>
          <th scope="col">{MembersTableText.status}</th>
          <th scope="col">{MembersTableText.lastActive}</th>
          <th scope="col">
            <span className={styles.hidden}>{MembersTableText.openColumn}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const name = memberName(item.member);
          const href = hrefFor(item.member.id);
          return (
            <tr key={item.member.id} className={styles.row}>
              <td>
                <Link to={href} className={styles.person}>
                  <Avatar name={name} />
                  <span className={styles.personText}>
                    <b className={styles.name}>{name}</b>
                    {item.member.displayName.trim() ? (
                      <span className={styles.muted}>{item.member.email}</span>
                    ) : null}
                  </span>
                </Link>
              </td>
              <td>
                {item.roles.length ? (
                  <span className={styles.chips}>
                    {item.roles.map((role) => (
                      <RoleChip key={role.id} role={role} />
                    ))}
                  </span>
                ) : (
                  <span className={styles.muted}>
                    {MembersTableText.everyoneOnly}
                  </span>
                )}
              </td>
              <td>
                {item.groups.length ? (
                  <span className={styles.chips}>
                    {item.groups.map((group) => (
                      <Chip key={group.id} label={group.name} />
                    ))}
                  </span>
                ) : (
                  <span className={styles.muted}>
                    {MembersTableText.noGroups}
                  </span>
                )}
              </td>
              <td>
                <MemberStatusPill status={item.member.status} />
              </td>
              <td className={styles.muted}>{lastSeen(item, timeZone)}</td>
              <td className={styles.openCell}>
                <Link
                  to={href}
                  className={styles.open}
                  aria-label={MembersTableText.open(name)}
                  tabIndex={-1}
                >
                  <Icon name="next" />
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

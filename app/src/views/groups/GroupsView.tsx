// File : /TeamSamsara.Workflow/app/src/views/groups/GroupsView.tsx
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Every work group as a card, the viewer's own first: its badge,
// whether they lead it or are in it, its lead, what's next and how many tasks
// are open (when the viewer may see them), and who's in it. A card opens the
// group's overview. People who manage work groups get New group.

import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { usePermissions } from "@/core/access";
import { isCurrentMember, type MemberRecord } from "@/core/data";
import { useSession } from "@/core/session";
import { useDisplayTime, useWorkspaceRecord } from "@/core/workspace";
import { memberName } from "@/features/members";
import {
  groupColor,
  useWorkGroups,
  type WorkGroupListItem,
} from "@/features/work-groups";
import { Avatar } from "@/shared/components/Avatar/Avatar";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { groupPath, RoutePaths } from "@/shared/constants/routePaths";
import { useNow } from "@/shared/hooks/useNow";
import { useGroupOverview } from "./useGroupOverview";
import { GroupsViewText as Text } from "./groupsViewContent";
import styles from "./Groups.module.css";

const stackSize = 4;

export function AvatarStack({ people }: { people: readonly MemberRecord[] }) {
  return (
    <span className={styles.stack}>
      {people.slice(0, stackSize).map((person) => (
        <Avatar
          key={person.id}
          name={memberName(person)}
          src={person.photoUrl}
          size="small"
        />
      ))}
      {people.length > stackSize ? (
        <span className={styles.stackMore}>
          {Text.more(people.length - stackSize)}
        </span>
      ) : null}
    </span>
  );
}

function GroupCard({ item, me }: { item: WorkGroupListItem; me: string }) {
  const time = useDisplayTime();
  const now = useNow();
  const members = (item.members ?? []).filter(isCurrentMember);
  const overview = useGroupOverview(
    item.group.id,
    members.map((member) => member.id),
    now,
  );
  const lead = item.leads?.[0] ?? null;
  const next = overview.events?.[0] ?? null;
  const weekday = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: time.timeZone,
    }).format(date);
  const status = item.group.leadIds.includes(me)
    ? Text.youLead
    : members.some((member) => member.id === me)
      ? Text.youreIn
      : Text.members(members.length);

  return (
    <Link
      to={groupPath(item.group.id)}
      className={styles.card}
      style={{ "--group-color": groupColor(item.group) } as CSSProperties}
    >
      <span className={styles.cardHead}>
        <span className={styles.badge} aria-hidden="true">
          {item.group.name.trim().charAt(0).toUpperCase()}
        </span>
        <span className={styles.cardTitle}>
          <b className={styles.cardName}>{item.group.name}</b>
          <span className={styles.muted}>{status}</span>
        </span>
      </span>
      <span className={styles.lead}>
        {lead ? (
          <>
            <Avatar name={memberName(lead)} src={lead.photoUrl} size="small" />
            <span className={styles.leadText}>
              <b>{memberName(lead)}</b>
              <span className={styles.muted}>{Text.lead}</span>
            </span>
          </>
        ) : (
          <span className={styles.muted}>{Text.noLead}</span>
        )}
      </span>
      <span className={styles.facts}>
        <span className={styles.muted}>{Text.nextUp}</span>
        <span className={styles.muted}>{Text.openTasks}</span>
        <b>
          {overview.events === null
            ? Text.hidden
            : next
              ? `${weekday(next.startsAt)} · ${next.title}`
              : Text.nothingPlanned}
        </b>
        <b>{overview.tasks === null ? Text.hidden : overview.tasks.length}</b>
      </span>
      <AvatarStack people={members} />
    </Link>
  );
}

export function GroupsView() {
  const workspace = useWorkspaceRecord();
  const access = usePermissions();
  const session = useSession();
  const me = session.status === "active" ? session.member.id : "";
  const mine = session.status === "active" ? session.member.workGroupIds : [];
  const groups = useWorkGroups();
  const sorted = [...groups.items].sort(
    (a, b) =>
      Number(mine.includes(b.group.id)) - Number(mine.includes(a.group.id)) ||
      a.group.name.localeCompare(b.group.name),
  );

  return (
    <div className={styles.page}>
      <PageHeader
        title={
          <>
            {Text.title}
            {groups.status === "ready" ? (
              <span className={styles.count}>{groups.items.length}</span>
            ) : null}
          </>
        }
        description={Text.intro(workspace.name)}
        actions={
          access.can("manageWorkGroups") ? (
            <LinkButton
              to={RoutePaths.settingsGroups}
              variant="primary"
              iconStart="add"
            >
              {Text.newGroup}
            </LinkButton>
          ) : null
        }
      />
      {groups.status === "loading" ? (
        <Spinner label={Text.loading} />
      ) : sorted.length === 0 ? (
        <div>
          <p>{Text.none}</p>
          <p className={styles.muted}>{Text.noneHelp}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {sorted.map((item) => (
            <GroupCard key={item.group.id} item={item} me={me} />
          ))}
        </div>
      )}
    </div>
  );
}

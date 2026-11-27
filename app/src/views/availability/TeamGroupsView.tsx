// File : /TeamSamsara.Workflow/app/src/views/availability/TeamGroupsView.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-calendars-lists
// Author : Gerrah
// Purpose : Team availability's first page: the member's groups, then every
// other group, as cards. Each opens that group's week on its own page (it
// replaces the work group picker).

import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { isCurrentMember } from "@/core/data";
import { useSession } from "@/core/session";
import { useDisplayTime } from "@/core/workspace";
import { memberName } from "@/features/members";
import {
  groupColor,
  useWorkGroups,
  type WorkGroupListItem,
} from "@/features/work-groups";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import {
  RoutePaths,
  teamAvailabilityPath,
} from "@/shared/constants/routePaths";
import { AvatarStack } from "../groups/GroupsView";
import { TeamGroupsText as Text } from "./availabilityViewContent";
import styles from "../groups/Groups.module.css";

function GroupCard({
  item,
  isMine,
}: {
  item: WorkGroupListItem;
  isMine: boolean;
}) {
  const people = (item.members ?? []).filter(isCurrentMember);
  const lead = item.leads?.[0] ?? null;
  return (
    <Link
      to={teamAvailabilityPath(item.group.id)}
      className={styles.card}
      style={{ "--group-color": groupColor(item.group) } as CSSProperties}
    >
      <span className={styles.cardHead}>
        <span className={styles.badge} aria-hidden="true">
          {item.group.name.trim().charAt(0).toUpperCase()}
        </span>
        <span className={styles.cardTitle}>
          <b className={styles.cardName}>{item.group.name}</b>
          <span className={styles.muted}>
            {[
              isMine ? Text.yours : null,
              lead ? Text.ledBy(memberName(lead)) : null,
              Text.people(people.length),
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
      </span>
      <AvatarStack people={people} />
      <b className={styles.muted}>{Text.seeWeek}</b>
    </Link>
  );
}

export function TeamGroupsView() {
  const session = useSession();
  const time = useDisplayTime();
  const mine = session.status === "active" ? session.member.workGroupIds : [];
  const groups = useWorkGroups();
  const byName = [...groups.items].sort((a, b) =>
    a.group.name.localeCompare(b.group.name),
  );
  const yours = byName.filter((item) => mine.includes(item.group.id));
  const others = byName.filter((item) => !mine.includes(item.group.id));

  return (
    <div className={styles.page}>
      <PageHeader
        title={Text.title}
        description={Text.description(time.timeZone)}
        actions={
          <LinkButton to={RoutePaths.availability} iconStart="user">
            {Text.mine}
          </LinkButton>
        }
      />
      {groups.status === "loading" ? (
        <Spinner label={Text.loading} />
      ) : groups.items.length === 0 ? (
        <p className={styles.muted}>{Text.none}</p>
      ) : (
        <>
          {yours.length > 0 ? (
            <section className={styles.list} aria-label={Text.yourGroups}>
              <h2 className={styles.sectionTitle}>{Text.yourGroups}</h2>
              <div className={styles.grid}>
                {yours.map((item) => (
                  <GroupCard key={item.group.id} item={item} isMine />
                ))}
              </div>
            </section>
          ) : null}
          {others.length > 0 ? (
            <section className={styles.list} aria-label={Text.otherGroups}>
              <h2 className={styles.sectionTitle}>
                {yours.length > 0 ? Text.otherGroups : Text.allGroups}
              </h2>
              <div className={styles.grid}>
                {others.map((item) => (
                  <GroupCard key={item.group.id} item={item} isMine={false} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

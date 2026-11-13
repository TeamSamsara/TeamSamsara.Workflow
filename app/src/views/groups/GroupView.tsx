// File : /TeamSamsara.Workflow/app/src/views/groups/GroupView.tsx
// Version : 1.1.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : One work group's overview: a band in its colour behind its badge,
// its leads and size, and Plan an event (for planners). Members as a grid,
// filtered by people tag, each opening their profile (Add member for people
// who manage groups); how it hands out tasks, for its leads and managers; its open tasks with who they're given to and when
// they're due; and beside them About, Key resources (its links) and Up next.
// Tabs: Overview here, Calendar and Availability open those pages on this
// group; See all lists every open task.

import type { CSSProperties } from "react";
import { useCallback, useState } from "react";
import { useTaskOrder } from "@/features/events";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { usePermissions, useActor } from "@/core/access";
import { isCurrentMember, type MemberRecord } from "@/core/data";
import { useDisplayTime } from "@/core/workspace";
import { formatDue, type TaskRecord } from "@/features/tasks";
import { memberName } from "@/features/members";
import { usePeopleTags } from "@/features/people-tags";
import {
  GroupHandOut,
  groupColor,
  useWorkGroups,
} from "@/features/work-groups";
import { Avatar } from "@/shared/components/Avatar/Avatar";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { NavTabs } from "@/shared/components/Tabs/NavTabs";
import {
  eventPath,
  groupPath,
  personPath,
  RoutePaths,
  taskPath,
  workGroupPath,
} from "@/shared/constants/routePaths";
import { useNow } from "@/shared/hooks/useNow";
import { Icon } from "@/shared/icons/Icon";
import { formatDate, formatTime } from "@/shared/time/dates";
import { AvatarStack } from "./GroupsView";
import { useGroupOverview } from "./useGroupOverview";
import { GroupViewText as Text } from "./groupsViewContent";
import styles from "./Groups.module.css";

const shownTasks = 8;

export function GroupView() {
  const { groupId = "" } = useParams();
  const [params] = useSearchParams();
  const access = usePermissions();
  const actor = useActor();
  const groups = useWorkGroups();
  const tags = usePeopleTags();
  const time = useDisplayTime();
  const now = useNow();
  const [tagFilter, setTagFilter] = useState("all");
  const item = groups.items.find((entry) => entry.group.id === groupId);
  const members = (item?.members ?? []).filter(isCurrentMember);
  const overview = useGroupOverview(
    groupId,
    members.map((member) => member.id),
    now,
  );
  const showTasks = params.get("tab") === "tasks";
  const groupEvents = overview.events;
  const inOrder = useTaskOrder(
    useCallback(
      (eventId: string) =>
        groupEvents?.find((event) => event.id === eventId)?.workflowIds,
      [groupEvents],
    ),
  );

  if (groups.status === "loading") return <Spinner label={Text.loading} />;
  if (!item)
    return (
      <div className={styles.page}>
        <p>{Text.notFound}</p>
        <LinkButton to={RoutePaths.groups} iconStart="back" variant="ghost">
          {Text.back}
        </LinkButton>
      </div>
    );

  const { group } = item;
  const leads = item.leads ?? [];
  const canManage = access.can("manageWorkGroups");
  // Its leads and the people who manage groups choose how it hands out tasks.
  const showsHandOut = canManage || (actor?.leadOf.includes(group.id) ?? false);
  const weekAhead = now.getTime() + 7 * 24 * 60 * 60 * 1000;
  const loadOf = (memberId: string) =>
    (overview.tasks ?? []).filter(
      (task) =>
        task.memberId === memberId &&
        task.dueAt !== null &&
        task.dueAt.getTime() <= weekAhead,
    ).length;
  const groupTags = tags.items.filter((tag) =>
    members.some((member) => member.tagIds.includes(tag.id)),
  );
  const shownMembers =
    tagFilter === "all"
      ? members
      : members.filter((member) => member.tagIds.includes(tagFilter));
  const nameOf = (id: string | null) => {
    const found = id ? members.find((member) => member.id === id) : undefined;
    return found ? memberName(found) : null;
  };
  const due = (task: TaskRecord) =>
    task.dueAt
      ? formatDue(
          task.dueAt,
          time.timeZone,
          time.timeFormat,
          time.dateFormat,
          now,
        )
      : Text.noDue;
  const tasks = inOrder(overview.tasks ?? []);
  const metaOf = (member: MemberRecord) => {
    const tag = tags.items.find((entry) => member.tagIds.includes(entry.id));
    const parts = [
      ...(tag ? [tag.name] : []),
      ...(group.leadIds.includes(member.id) ? [Text.lead] : []),
    ];
    return { tag, text: parts.join(" · ") };
  };

  return (
    <div
      className={styles.page}
      style={{ "--group-color": groupColor(group) } as CSSProperties}
    >
      <PageHeader
        title={group.name}
        breadcrumbs={[
          { label: Text.groups, to: RoutePaths.groups },
          { label: group.name },
        ]}
        actions={
          <>
            <AvatarStack people={members} />
            {canManage ? (
              <LinkButton
                to={workGroupPath(group.id)}
                variant="secondary"
                iconStart="add"
              >
                {Text.addMembers}
              </LinkButton>
            ) : null}
          </>
        }
      />
      <NavTabs
        label={Text.tabsLabel}
        items={[
          { to: groupPath(group.id), label: Text.tabs.overview, end: true },
          {
            to: `${RoutePaths.calendar}?cal=${encodeURIComponent(group.id)}`,
            label: Text.tabs.calendar,
          },
          ...(access.can("viewAvailability")
            ? [
                {
                  to: `${RoutePaths.availabilityTeam}?group=${encodeURIComponent(group.id)}`,
                  label: Text.tabs.availability,
                },
              ]
            : []),
        ]}
      />

      <div className={styles.band} aria-hidden="true" />
      <div className={styles.hero}>
        <span className={styles.badge} data-size="large" aria-hidden="true">
          {group.name.trim().charAt(0).toUpperCase()}
        </span>
        <div className={styles.heroText}>
          <span className={styles.muted}>
            {Text.leads(leads.map(memberName))} · {Text.members(members.length)}
          </span>
        </div>
        <div className={styles.heroActions}>
          {access.can("planEvents") ? (
            <LinkButton
              to={`${RoutePaths.newEvent}?group=${encodeURIComponent(group.id)}`}
              variant="secondary"
              iconStart="calendar"
            >
              {Text.planEvent}
            </LinkButton>
          ) : null}
        </div>
      </div>

      <div className={styles.columns}>
        <div className={styles.main}>
          <section className={styles.section} aria-labelledby="group-members">
            <div className={styles.sectionHead}>
              <h2 id="group-members" className={styles.sectionTitle}>
                {Text.membersTitle(members.length)}
              </h2>
              <span className={styles.spacer} />
              {groupTags.length > 0 ? (
                <SegmentedControl
                  label={Text.filterLabel}
                  options={[
                    { value: "all", label: Text.all },
                    ...groupTags.map((tag) => ({
                      value: tag.id,
                      label: tag.name,
                    })),
                  ]}
                  value={tagFilter}
                  onChange={setTagFilter}
                />
              ) : null}
            </div>
            {members.length === 0 && !canManage ? (
              <p className={styles.muted}>{Text.noMembers}</p>
            ) : (
              <div className={styles.people}>
                {canManage ? (
                  <Link to={workGroupPath(group.id)} className={styles.addSlot}>
                    <span className={styles.addCircle}>
                      <Icon name="add" />
                    </span>
                    {Text.addMember}
                  </Link>
                ) : null}
                {shownMembers.map((member) => {
                  const meta = metaOf(member);
                  return (
                    <span key={member.id} className={styles.person}>
                      <Avatar name={memberName(member)} src={member.photoUrl} />
                      <span className={styles.personText}>
                        <Link
                          to={personPath(member.id)}
                          className={styles.personName}
                        >
                          {memberName(member)}
                        </Link>
                        {meta.text ? (
                          <span className={styles.personMeta}>
                            {meta.tag ? (
                              <span
                                className={styles.tagDot}
                                style={
                                  {
                                    "--tag-color": meta.tag.color,
                                  } as CSSProperties
                                }
                              />
                            ) : null}
                            {meta.text}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </section>

          {showsHandOut ? (
            <section className={styles.section} aria-label={Text.handOut}>
              <GroupHandOut group={group} members={members} loadOf={loadOf} />
            </section>
          ) : null}

          <section className={styles.section} aria-labelledby="group-tasks">
            <div className={styles.sectionHead}>
              <h2 id="group-tasks" className={styles.sectionTitle}>
                {Text.openTasks}
              </h2>
              {overview.tasks && tasks.length > shownTasks ? (
                <Link to={`${groupPath(group.id)}?tab=tasks`}>
                  {Text.seeAll}
                </Link>
              ) : null}
            </div>
            {overview.tasks === null ? (
              <p className={styles.muted}>{Text.cantSeeTasks}</p>
            ) : tasks.length === 0 ? (
              <p className={styles.muted}>{Text.noTasks}</p>
            ) : (
              <div className={styles.table}>
                <div className={styles.tableHead} aria-hidden="true">
                  <span>{Text.task}</span>
                  <span>{Text.givenTo}</span>
                  <span className={styles.dueCell}>{Text.due}</span>
                </div>
                {(showTasks ? tasks : tasks.slice(0, shownTasks)).map(
                  (task) => {
                    const who = nameOf(task.memberId);
                    const late = task.dueAt !== null && task.dueAt < now;
                    return (
                      <div key={task.id} className={styles.tableRow}>
                        <span>
                          <Link
                            to={taskPath(task.id)}
                            className={styles.taskLink}
                          >
                            {task.title}
                          </Link>
                        </span>
                        <span
                          className={styles.whoChip}
                          data-nobody={who ? undefined : true}
                        >
                          {who ?? Text.nobodyYet}
                        </span>
                        <span
                          className={styles.dueCell}
                          data-late={late || undefined}
                        >
                          {due(task)}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </section>
        </div>

        <aside className={styles.side}>
          <section className={styles.section} aria-labelledby="group-about">
            <h2 id="group-about" className={styles.sectionTitle}>
              {Text.about}
            </h2>
            <p className={group.description ? undefined : styles.muted}>
              {group.description || Text.noAbout}
            </p>
          </section>
          <section className={styles.section} aria-labelledby="group-links">
            <h2 id="group-links" className={styles.sectionTitle}>
              {Text.resources}
            </h2>
            {group.links.length === 0 ? (
              <p className={styles.muted}>{Text.noResources}</p>
            ) : (
              group.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.resource}
                >
                  <Icon name="externalLink" />
                  <span className={styles.personText}>
                    <b>{link.label || link.url}</b>
                    <span className={styles.muted}>
                      {link.url.replace(/^https?:\/\//, "").split("/")[0]}
                    </span>
                  </span>
                </a>
              ))
            )}
          </section>
          <section className={styles.section} aria-labelledby="group-next">
            <h2 id="group-next" className={styles.sectionTitle}>
              {Text.upNext}
            </h2>
            {overview.events === null ? (
              <p className={styles.muted}>{Text.cantSeeEvents}</p>
            ) : overview.events.length === 0 ? (
              <p className={styles.muted}>{Text.nothingPlanned}</p>
            ) : (
              overview.events.slice(0, 3).map((event) => (
                <Link
                  key={event.id}
                  to={eventPath(event.id)}
                  className={styles.upNext}
                >
                  <b>{event.title}</b>
                  <span className={styles.muted}>
                    {formatDate(event.startsAt, time.timeZone, time.dateFormat)}{" "}
                    ·{" "}
                    {formatTime(event.startsAt, time.timeZone, time.timeFormat)}
                  </span>
                </Link>
              ))
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

// File : /TeamSamsara.Workflow/app/src/views/people/MemberProfileView.tsx
// Version : 1.1.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Someone's read-only profile, opened from their name anywhere: who
// they are (photo, names, people tags, work groups, email for people who
// manage members) and what time it is for them; their usual week in their
// time or the viewer's; what's coming up for them that the viewer can see,
// with their reply; and their open tasks the viewer can already see.

import { useMemo, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { usePermissions } from "@/core/access";
import { useSession } from "@/core/session";
import { useDisplayTime, useWorkspaceRecord } from "@/core/workspace";
import {
  hoursApart,
  useAllAvailability,
  useBusyInRange,
  UsualWeekStrip,
} from "@/features/availability";
import {
  CalendarText,
  useEventsInRange,
  useSeesAllEvents,
  useSeesAllTasks,
} from "@/features/events";
import { memberName, memberSubName, useMembers } from "@/features/members";
import { TagEditor, usePeopleTags } from "@/features/people-tags";
import { formatDue, useOpenTasksFor } from "@/features/tasks";
import { groupColor, useWorkGroups } from "@/features/work-groups";
import { Avatar } from "@/shared/components/Avatar/Avatar";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import {
  eventPath,
  groupPath,
  RoutePaths,
  taskPath,
} from "@/shared/constants/routePaths";
import { useNow } from "@/shared/hooks/useNow";
import { dayKey, formatDate, formatTime } from "@/shared/time/dates";
import { zoneCity } from "@/shared/time/timeZones";
import { weekOf } from "@/shared/time/weekGrid";
import { MemberProfileText as Text } from "./memberProfileViewContent";
import styles from "./MemberProfile.module.css";

const ahead = 14 * 24 * 60 * 60 * 1000;

export function MemberProfileView() {
  const { memberId = "" } = useParams();
  const access = usePermissions();
  const session = useSession();
  const viewer = session.status === "active" ? session.member : null;
  const workspace = useWorkspaceRecord();
  const time = useDisplayTime();
  const now = useNow();
  const members = useMembers();
  const groups = useWorkGroups();
  const tags = usePeopleTags();
  const availability = useAllAvailability();
  const seesAllEvents = useSeesAllEvents();
  const seesAllTasks = useSeesAllTasks();
  const [zone, setZone] = useState<"theirs" | "mine">("theirs");

  const person = members.records.find((entry) => entry.id === memberId);
  const theirZone = person?.timeZone ?? workspace.timeZone;
  const shownZone = zone === "theirs" ? theirZone : time.timeZone;
  const today = dayKey(now, shownZone);
  const week = useMemo(
    () => weekOf(today, workspace.weekStartsOn, shownZone, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, workspace.weekStartsOn, shownZone],
  );
  const busy = useBusyInRange(week.start, week.end).filter(
    (entry) => entry.memberId === memberId,
  );

  // The hour's start, so the query stays the same for the hour.
  const hourKey = Math.floor(now.getTime() / 3_600_000);
  const from = useMemo(() => new Date(hourKey * 3_600_000), [hourKey]);
  const to = useMemo(() => new Date(from.getTime() + ahead), [from]);
  const events = useEventsInRange(
    from,
    to,
    seesAllEvents ? { kind: "all" } : { kind: "mine" },
    viewer ? { id: viewer.id, workGroupIds: viewer.workGroupIds } : null,
  );
  // Theirs by name for people who see every task; else the viewer's own list.
  const theirs = useOpenTasksFor(seesAllTasks ? memberId : null, []);
  const mine = useOpenTasksFor(
    seesAllTasks ? null : (viewer?.id ?? null),
    seesAllTasks ? [] : (viewer?.workGroupIds ?? []),
  );

  if (members.status === "loading") return <Spinner label={Text.loading} />;
  if (!person) return <p>{Text.notFound}</p>;

  const name = memberName(person);
  const theirGroups = groups.items
    .map((item) => item.group)
    .filter((group) => person.workGroupIds.includes(group.id));
  const canTag = access.can("tagPeople") || access.can("manageMembers");
  const apart = hoursApart(theirZone, time.timeZone, now);
  const coming = events.items
    .filter(
      (event) =>
        event.everyone ||
        event.memberIds.includes(person.id) ||
        event.groupIds.some((id) => person.workGroupIds.includes(id)),
    )
    .slice(0, 5);
  const tasks = (seesAllTasks ? theirs.items : mine.items)
    .filter((task) => task.memberId === person.id)
    .sort(
      (a, b) =>
        (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity),
    );
  const busyList = busy
    .map(
      (entry) =>
        `${formatDate(entry.startsAt, shownZone, time.dateFormat)} ${formatTime(entry.startsAt, shownZone, time.timeFormat)} – ${formatTime(entry.endsAt, shownZone, time.timeFormat)}`,
    )
    .join(", ");
  const replyOf = (event: (typeof coming)[number]) => {
    const answer = event.replies[person.id]?.answer;
    if (answer) return answer;
    return event.asksReply ? "waiting" : "none";
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title={name}
        breadcrumbs={[
          { label: Text.groups, to: RoutePaths.groups },
          ...(theirGroups[0]
            ? [{ label: theirGroups[0].name, to: groupPath(theirGroups[0].id) }]
            : []),
          { label: name },
        ]}
      />
      <div className={styles.columns}>
        <section className={styles.card} aria-label={name}>
          <Avatar
            name={name}
            src={person.photoUrl}
            size="large"
            className={styles.photo}
          />
          <div>
            <h2 className={styles.name}>{name}</h2>
            {memberSubName(person) ? (
              <p className={styles.muted}>{memberSubName(person)}</p>
            ) : null}
            {access.can("manageMembers") ? (
              <p className={styles.muted}>{person.email}</p>
            ) : null}
          </div>
          <div className={styles.field}>
            <span className={styles.label}>{Text.tags}</span>
            <TagEditor
              memberId={person.id}
              name={name}
              tagIds={person.tagIds}
              tags={tags.items}
              canEdit={canTag}
              compact
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>{Text.workGroups}</span>
            {theirGroups.length === 0 ? (
              <span className={styles.muted}>{Text.noGroups}</span>
            ) : (
              <div className={styles.chips}>
                {theirGroups.map((group) => (
                  <Link
                    key={group.id}
                    to={groupPath(group.id)}
                    className={styles.groupLink}
                  >
                    <span
                      className={styles.dot}
                      style={
                        { backgroundColor: groupColor(group) } as CSSProperties
                      }
                    />
                    {group.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className={styles.clock}>
            <span>
              <b className={styles.clockTime}>
                {formatTime(now, theirZone, time.timeFormat)}
              </b>{" "}
              <span className={styles.muted}>{Text.forThem}</span>
            </span>
            <span className={styles.muted}>
              {apart === 0
                ? Text.sameTime(zoneCity(theirZone))
                : Text.apart(zoneCity(theirZone), apart)}
            </span>
          </div>
        </section>

        <div className={styles.main}>
          <section className={styles.section} aria-labelledby="usual-week">
            <div className={styles.sectionHead}>
              <h2 id="usual-week" className={styles.sectionTitle}>
                {Text.usualWeek}
              </h2>
              {theirZone !== time.timeZone ? (
                <SegmentedControl
                  label={Text.zoneLabel}
                  options={[
                    { value: "theirs", label: Text.theirTime },
                    { value: "mine", label: Text.myTime },
                  ]}
                  value={zone}
                  onChange={setZone}
                />
              ) : null}
            </div>
            <UsualWeekStrip
              availability={availability.get(person.id) ?? null}
              days={week.days}
              dayNames={CalendarText.weekdays[workspace.weekStartsOn]}
              timeZone={shownZone}
              clock={time.timeFormat}
            />
            {busy.length > 0 ? (
              <p className={styles.muted}>{Text.busyNote(busyList)}</p>
            ) : null}
          </section>

          <section className={styles.section} aria-labelledby="coming-up">
            <h2 id="coming-up" className={styles.sectionTitle}>
              {Text.comingUp}
            </h2>
            {coming.length === 0 ? (
              <p className={styles.muted}>{Text.nothingComingUp}</p>
            ) : (
              coming.map((event) => {
                const reply = replyOf(event);
                return (
                  <Link
                    key={event.id}
                    to={eventPath(event.id)}
                    className={styles.row}
                  >
                    <span className={styles.when}>
                      {formatDate(
                        event.startsAt,
                        time.timeZone,
                        time.dateFormat,
                      )}{" "}
                      ·{" "}
                      {formatTime(
                        event.startsAt,
                        time.timeZone,
                        time.timeFormat,
                      )}
                    </span>
                    <b className={styles.what}>{event.title}</b>
                    <span className={styles.reply} data-answer={reply}>
                      {Text.replies[reply]}
                    </span>
                  </Link>
                );
              })
            )}
          </section>

          <section className={styles.section} aria-labelledby="their-tasks">
            <div className={styles.sectionHead}>
              <h2 id="their-tasks" className={styles.sectionTitle}>
                {Text.theirTasks}
              </h2>
            </div>
            {tasks.length === 0 ? (
              <p className={styles.muted}>{Text.noTasks}</p>
            ) : (
              tasks.map((task) => (
                <Link
                  key={task.id}
                  to={taskPath(task.id)}
                  className={styles.row}
                >
                  <b className={styles.what}>{task.title}</b>
                  <span className={styles.due}>
                    {task.dueAt
                      ? formatDue(
                          task.dueAt,
                          time.timeZone,
                          time.timeFormat,
                          time.dateFormat,
                          now,
                        )
                      : Text.noDue}
                  </span>
                </Link>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

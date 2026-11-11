// File : /TeamSamsara.Workflow/app/src/features/availability/ui/AvailabilityCheck.tsx
// Version : 1.2.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Who can make an event, shown while planning it: how many of the
// people in it are free, a small timeline per person around the event, who's
// busy or unavailable, and times when everyone's free to move it to. When
// some people are required, only they count and the free times are theirs;
// optional people are listed but don't block a time. A chip on each person
// switches it, the same switch as in Who's coming.

import type { CSSProperties } from "react";
import { useSession } from "@/core/session";
import { addDayKeys } from "@/shared/time/weekGrid";
import { dayKey } from "@/shared/time/dates";
import { fromWallTime, toWallTime } from "@/shared/time/zonedTime";
import {
  useAllAvailability,
  useBusyInRange,
  usePersonalInRange,
} from "../hooks/useAvailability";
import {
  checkPerson,
  freeTimes,
  stretches,
  type PersonTime,
} from "../model/freeBusy";
import { CheckText as Text } from "./availabilityContent";
import styles from "./AvailabilityCheck.module.css";

interface AvailabilityCheckProps {
  people: readonly { id: string; name: string }[];
  start: Date;
  end: Date;
  timeZone: string;
  now: Date;
  /** "7:00 – 9:00 PM" */
  spanLabel: (start: Date, end: Date) => string;
  /** "Tue 6 – 9 PM", for the free-time buttons. */
  slotLabel: (start: Date, end: Date) => string;
  onPick: (start: Date) => void;
  /** The people the event is planned around; none means everyone counts. */
  requiredIds?: readonly string[];
  /** Makes someone required or optional. */
  onToggleRequired?: (memberId: string) => void;
}

const hour = 3_600_000;
const shownPeople = 10;
const maxListed = 30;

export function AvailabilityCheck({
  people,
  start,
  end,
  timeZone,
  now,
  spanLabel,
  slotLabel,
  onPick,
  requiredIds = [],
  onToggleRequired,
}: AvailabilityCheckProps) {
  const hasRequired = requiredIds.length > 0;
  const isRequired = (id: string) => !hasRequired || requiredIds.includes(id);
  const session = useSession();
  const me = session.status === "active" ? session.member.id : null;
  const firstDay = dayKey(start, timeZone);
  const midnight = (key: string) => {
    const [year, month, day] = key.split("-").map(Number);
    return fromWallTime({ year, month, day, hour: 0, minute: 0 }, timeZone);
  };
  const rangeStart = midnight(firstDay);
  const rangeEnd = midnight(addDayKeys(firstDay, 7));
  const availability = useAllAvailability();
  const busy = useBusyInRange(rangeStart, rangeEnd);
  const titles = usePersonalInRange(me, rangeStart, rangeEnd, {
    shared: true,
  });

  const timeOf = (memberId: string): PersonTime => ({
    availability: availability.get(memberId) ?? null,
    busy: busy
      .filter((entry) => entry.memberId === memberId)
      .map((entry) => ({
        ...entry,
        title: titles.find((own) => own.id === entry.id)?.title,
      })),
  });

  const checks = people.map((person) => ({
    person,
    ...checkPerson(timeOf(person.id), start, end, timeZone),
  }));
  const counted = checks.filter((check) => isRequired(check.person.id));
  const optional = checks.filter((check) => !isRequired(check.person.id));
  const free = counted.filter((check) => check.state === "free").length;
  const optionalFree = optional.filter(
    (check) => check.state === "free",
  ).length;
  const minutes = Math.round((end.getTime() - start.getTime()) / 60_000);
  const startWall = toWallTime(start, timeZone);
  const suggestions =
    free === counted.length
      ? []
      : freeTimes(
          counted.map((check) => timeOf(check.person.id)),
          minutes,
          Array.from({ length: 7 }, (_unused, index) => {
            const key = addDayKeys(firstDay, index);
            const [year, month, day] = key.split("-").map(Number);
            return {
              from: fromWallTime(
                { year, month, day, hour: 8, minute: 0 },
                timeZone,
              ),
              to: midnight(addDayKeys(key, 1)),
              preferred: fromWallTime(
                {
                  year,
                  month,
                  day,
                  hour: startWall.hour,
                  minute: startWall.minute,
                },
                timeZone,
              ),
            };
          }),
          timeZone,
          now,
        ).filter((time) => time.getTime() !== start.getTime());

  const windowFrom = new Date(start.getTime() - 2 * hour);
  const windowTo = new Date(end.getTime() + 2 * hour);
  const span = windowTo.getTime() - windowFrom.getTime();
  const place = (from: Date, to: Date): CSSProperties => ({
    left: `${((from.getTime() - windowFrom.getTime()) / span) * 100}%`,
    width: `${((to.getTime() - from.getTime()) / span) * 100}%`,
  });
  const conflicts = checks.filter((check) => check.state !== "free");
  // With the Required switch, everyone is listed (required first) so anyone
  // can be switched; otherwise a long list shows just who can't make it.
  const rows = onToggleRequired
    ? [...counted, ...optional].slice(0, maxListed)
    : (checks.length > shownPeople ? conflicts : checks).slice(0, shownPeople);

  return (
    <div className={styles.check} aria-live="polite">
      <div className={styles.head}>
        <span className={styles.dot} data-all={free === counted.length} />
        <b>
          {hasRequired
            ? Text.requiredCanMake(free, counted.length)
            : free === people.length
              ? Text.everyoneFree(people.length)
              : Text.canMake(free, people.length)}
        </b>
        <span className={styles.muted}>{spanLabel(start, end)}</span>
      </div>
      {hasRequired && optional.length > 0 ? (
        <span className={styles.muted}>
          {Text.optionalFree(optionalFree, optional.length)}
        </span>
      ) : null}
      {rows.length > 0 ? (
        <div className={styles.rows}>
          {rows.map(({ person, state }) => (
            <div key={person.id} className={styles.row}>
              <span className={styles.who}>
                <span
                  className={styles.name}
                  data-conflict={state !== "free" && isRequired(person.id)}
                >
                  {person.name}
                </span>
                {onToggleRequired ? (
                  <button
                    type="button"
                    className={styles.chip}
                    data-required={
                      (hasRequired && isRequired(person.id)) || undefined
                    }
                    aria-pressed={hasRequired && isRequired(person.id)}
                    aria-label={Text.requiredToggle(person.name)}
                    onClick={() => onToggleRequired(person.id)}
                  >
                    {hasRequired && isRequired(person.id)
                      ? Text.required
                      : Text.optional}
                  </button>
                ) : null}
              </span>
              <span className={styles.track}>
                {stretches(timeOf(person.id), windowFrom, windowTo, timeZone)
                  .filter((part) => part.state !== "free")
                  .map((part) => (
                    <span
                      key={part.start.getTime()}
                      className={styles.part}
                      data-state={part.state}
                      style={place(part.start, part.end)}
                    />
                  ))}
                <span
                  className={styles.event}
                  style={place(start, end)}
                  aria-hidden
                />
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {conflicts.length > 0 ? (
        <ul className={styles.list}>
          {conflicts.map(({ person, state, title }) => (
            <li key={person.id}>
              {state === "busy"
                ? Text.busy(person.name, title, "then")
                : Text.unavailable(person.name)}
              {isRequired(person.id) ? null : ` ${Text.optionalNote}`}
            </li>
          ))}
        </ul>
      ) : null}
      {free < counted.length ? (
        <div className={styles.free}>
          <b>{hasRequired ? Text.requiredFreeTimes : Text.freeTimes}</b>
          {suggestions.length === 0 ? (
            <span className={styles.muted}>{Text.noFreeTimes}</span>
          ) : (
            <>
              {suggestions.map((time) => {
                const label = slotLabel(
                  time,
                  new Date(time.getTime() + minutes * 60_000),
                );
                return (
                  <button
                    key={time.getTime()}
                    type="button"
                    className={styles.pick}
                    aria-label={Text.pickTime(label)}
                    onClick={() => onPick(time)}
                  >
                    {label}
                  </button>
                );
              })}
              <span className={styles.muted}>{Text.freeTimesNote}</span>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

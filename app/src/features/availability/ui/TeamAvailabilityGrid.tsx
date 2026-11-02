// File : /TeamSamsara.Workflow/app/src/features/availability/ui/TeamAvailabilityGrid.tsx
// Version : 1.0.0
// Latest commit: feature/people-time
// Author : Gerrah
// Purpose : A team's week at a glance: one row per person, one column per day
// from 8 AM to midnight, coloured by available, unavailable and personal
// appointments; a row of the team's events; clashes outlined in red; and a row
// of when everyone is free.

import type { CSSProperties } from "react";
import type { WeekDay } from "@/shared/time/weekGrid";
import { stretches, type PersonTime, type Stretch } from "../model/freeBusy";
import { dayFrom, dayTo } from "../model/teamTimes";
import { TeamText as Text } from "./availabilityContent";
import styles from "./TeamAvailabilityGrid.module.css";

export interface TeamPerson {
  id: string;
  name: string;
  initials: string;
}

export interface TeamEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
}

interface TeamAvailabilityGridProps {
  days: readonly WeekDay[];
  weekdayNames: readonly string[];
  people: readonly TeamPerson[];
  timeFor: (memberId: string) => PersonTime;
  events: readonly TeamEvent[];
  groupName: string;
  timeZone: string;
  /** "7:00 – 9:00 PM", for hover text. */
  spanLabel: (start: Date, end: Date) => string;
}

function place(start: Date, end: Date, day: WeekDay): CSSProperties {
  const from = dayFrom(day).getTime();
  const length = dayTo(day).getTime() - from;
  const left = Math.max(0, (start.getTime() - from) / length);
  const right = Math.min(1, (end.getTime() - from) / length);
  return {
    left: `${left * 100}%`,
    width: `${Math.max(0, right - left) * 100}%`,
  };
}

const overlaps = (
  a: { start: Date; end: Date },
  b: { start: Date; end: Date },
) => a.start < b.end && b.start < a.end;

export function TeamAvailabilityGrid({
  days,
  weekdayNames,
  people,
  timeFor,
  events,
  groupName,
  timeZone,
  spanLabel,
}: TeamAvailabilityGridProps) {
  const rows = people.map((person) => {
    const time = timeFor(person.id);
    let clashes = 0;
    const cells = days.map((day) => {
      const parts = stretches(time, dayFrom(day), dayTo(day), timeZone).filter(
        (part) => part.state !== "free",
      );
      const dayEvents = events.filter((event) =>
        overlaps(event, { start: dayFrom(day), end: dayTo(day) }),
      );
      const clashParts: Stretch[] = [];
      for (const event of dayEvents)
        for (const part of parts)
          if (overlaps(event, part)) {
            clashes += 1;
            clashParts.push({
              ...part,
              start: new Date(
                Math.max(event.start.getTime(), part.start.getTime()),
              ),
              end: new Date(Math.min(event.end.getTime(), part.end.getTime())),
              title: Text.clash(
                event.title,
                part.state === "busy"
                  ? (part.title ?? "Busy")
                  : Text.unavailableLabel,
              ),
            });
          }
      return { day, parts, clashParts };
    });
    return { person, cells, clashes };
  });

  const freeRow = days.map((day) => {
    const perPerson = people.map((person) =>
      stretches(timeFor(person.id), dayFrom(day), dayTo(day), timeZone),
    );
    const free: { start: Date; end: Date }[] = [];
    for (
      let at = dayFrom(day).getTime();
      at < dayTo(day).getTime();
      at += 30 * 60_000
    ) {
      const slot = { start: new Date(at), end: new Date(at + 30 * 60_000) };
      const everyone = perPerson.every((parts) =>
        parts.some(
          (part) =>
            part.state === "free" &&
            part.start <= slot.start &&
            part.end >= slot.end,
        ),
      );
      if (!everyone) continue;
      const last = free[free.length - 1];
      if (last && last.end.getTime() === slot.start.getTime())
        last.end = slot.end;
      else free.push(slot);
    }
    return { day, free };
  });

  return (
    <div className={styles.scroll}>
      <div className={styles.grid}>
        <div className={styles.corner}>{Text.range}</div>
        {days.map((day, index) => (
          <div
            key={day.key}
            className={styles.dayHead}
            data-today={day.isToday}
          >
            <span>
              {weekdayNames[index]} <b>{day.day}</b>
            </span>
            <span className={styles.ticks} aria-hidden>
              <span>8a</span>
              <span>12p</span>
              <span>4p</span>
              <span>8p</span>
              <span>12a</span>
            </span>
          </div>
        ))}

        <div className={styles.label} data-kind="events">
          <b>{Text.events(groupName)}</b>
          <span className={styles.note}>{Text.eventsNote}</span>
        </div>
        {days.map((day) => (
          <div key={day.key} className={styles.cell} data-kind="events">
            <div className={styles.track} data-kind="events">
              {events
                .filter((event) =>
                  overlaps(event, { start: dayFrom(day), end: dayTo(day) }),
                )
                .map((event) => (
                  <span
                    key={event.id}
                    className={styles.event}
                    style={place(event.start, event.end, day)}
                    title={`${event.title}, ${spanLabel(event.start, event.end)}`}
                  />
                ))}
            </div>
          </div>
        ))}

        {rows.length === 0 ? (
          <p className={styles.empty}>{Text.noMembers}</p>
        ) : null}
        {rows.map(({ person, cells, clashes }) => (
          <div key={person.id} className={styles.personRow}>
            <div className={styles.label}>
              <span className={styles.avatar} aria-hidden>
                {person.initials}
              </span>
              <span className={styles.name}>
                <b>{person.name}</b>
                {clashes > 0 ? (
                  <span className={styles.clashNote}>
                    {Text.clashes(clashes)}
                  </span>
                ) : null}
              </span>
            </div>
            {cells.map(({ day, parts, clashParts }) => (
              <div key={day.key} className={styles.cell}>
                <div className={styles.track}>
                  {parts.map((part) => (
                    <span
                      key={part.start.getTime()}
                      className={styles.part}
                      data-state={part.state}
                      style={place(part.start, part.end, day)}
                      title={`${spanLabel(part.start, part.end)}: ${part.state === "busy" ? (part.title ?? "Busy") : Text.unavailableLabel}`}
                    />
                  ))}
                  {clashParts.map((part) => (
                    <span
                      key={`clash-${part.start.getTime()}`}
                      className={styles.clash}
                      style={place(part.start, part.end, day)}
                      title={part.title}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        <div className={styles.label} data-kind="free">
          <b>{Text.everyoneFree}</b>
          <span className={styles.note}>
            {Text.allAvailable(people.length)}
          </span>
        </div>
        {freeRow.map(({ day, free }) => (
          <div key={day.key} className={styles.cell} data-kind="free">
            <div className={styles.track} data-kind="free">
              {free.map((part) => (
                <span
                  key={part.start.getTime()}
                  className={styles.free}
                  style={place(part.start, part.end, day)}
                  title={spanLabel(part.start, part.end)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// File : /TeamSamsara.Workflow/app/src/features/events/service/repeatService.ts
// Version : 1.3.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Repeats and their events. Makes a repeat and its next weeks of
// events; tops up the weeks ahead (any planner's browser can, and an event's
// id is its date, so it's never made twice); skips one date; ends the repeat
// after a date; and changes it from a date onward, moving, adding or removing
// upcoming events to match; and deletes this one, this and every later one,
// or the whole series, keeping finished tasks as history if asked. A repeat's
// events are found by their ids, since a planner may not be allowed to see
// all of them (people who see everything also find past ones by repeat).

import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  Collections,
  commitWrites,
  dataErrorKind,
  fromDate,
  serverTime,
  maxWritesPerBatch,
  splitIntoChunks,
  type BatchWrite,
} from "@/core/data";
import { taskConverter, type TaskRecord } from "@/features/tasks";
import type { WorkflowRecord } from "@/features/workflows";
import { db } from "@/lib/firebase";
import {
  addDays,
  occurrenceId,
  occurrenceStart,
  repeatDates,
} from "../model/repeatRule";
import {
  eventConverter,
  type EventFields,
  type EventRecord,
} from "../types/eventTypes";
import {
  RepeatLimits,
  type RepeatRecord,
  type RepeatSchedule,
} from "../types/repeatTypes";
import {
  lastDateBefore,
  planSeriesDeletion,
  seriesDates,
  type SeriesChoice,
} from "../model/seriesDeletion";
import { recordBulkPlan } from "./bulkPlanService";
import {
  deleteEventWrites,
  eventDetailsWrite,
  eventWrites,
  sharedData,
  type CreateOptions,
  type SharedFields,
} from "./eventService";

/** What a repeat's events share: everything but when, plus how long they last. */
export type SeriesFields = SharedFields & { minutes: number };

interface TopUpOptions extends Omit<CreateOptions, "workflows"> {
  /** Every workflow; the repeat's own are picked out. */
  workflows: readonly WorkflowRecord[];
  /** Today's date in the workspace's time zone. */
  today: string;
}

function scheduleData(schedule: RepeatSchedule) {
  return {
    weekdays: [...new Set(schedule.weekdays)].sort(),
    time: schedule.time,
    startDate: schedule.startDate,
    endKind: schedule.endKind,
    endDate: schedule.endKind === "onDate" ? schedule.endDate : null,
    endCount: schedule.endKind === "afterCount" ? schedule.endCount : null,
    skipDates: [...new Set(schedule.skipDates)]
      .sort()
      .slice(-RepeatLimits.skipDates),
  };
}

function seriesData(fields: SeriesFields) {
  return {
    ...sharedData(fields),
    minutes: Math.min(1440, Math.max(5, Math.round(fields.minutes))),
  };
}

const windowEnd = (today: string) =>
  addDays(today, RepeatLimits.weeksAhead * 7);

/** An occurrence that exists: its event, or "hidden" when this planner can't see it. */
type Found = EventRecord | "hidden";

/** Which of these dates already have their event, read one by one by id. */
async function findOccurrences(
  repeatId: string,
  dates: readonly string[],
): Promise<Map<string, Found>> {
  const found = new Map<string, Found>();
  await Promise.all(
    dates.map(async (date) => {
      const ref = doc(
        db,
        Collections.events,
        occurrenceId(repeatId, date),
      ).withConverter(eventConverter);
      try {
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) found.set(date, snapshot.data());
      } catch (error) {
        // Not allowed to read it means it exists for someone else.
        if (dataErrorKind(error) === "notAllowed") found.set(date, "hidden");
        else throw error;
      }
    }),
  );
  return found;
}

/** The tasks of these events, read once. */
async function tasksOf(eventIds: readonly string[]): Promise<TaskRecord[]> {
  const chunks = await Promise.all(
    splitIntoChunks(eventIds, 30).map((chunk) =>
      getDocs(
        query(
          collection(db, Collections.tasks),
          where("eventId", "in", chunk),
        ).withConverter(taskConverter),
      ),
    ),
  );
  return chunks.flatMap((snapshot) =>
    snapshot.docs.map((entry) => entry.data()),
  );
}

function occurrenceFields(
  repeat: RepeatRecord,
  date: string,
  timeZone: string,
): EventFields {
  const startsAt = occurrenceStart(date, repeat.time, timeZone);
  return {
    title: repeat.title,
    eventTypeId: repeat.eventTypeId,
    startsAt,
    endsAt: new Date(startsAt.getTime() + repeat.minutes * 60_000),
    link: repeat.link,
    details: repeat.details,
    notes: repeat.notes,
    audience: {
      everyone: repeat.everyone,
      groupIds: repeat.groupIds,
      memberIds: repeat.memberIds,
    },
    attendance: {
      asksReply: repeat.asksReply,
      requiredIds: repeat.requiredIds,
      tellEveryReply: repeat.tellEveryReply,
    },
  };
}

/**
 * Makes the repeat's missing events from today until the weeks ahead, with
 * their tasks. The events belong to whoever made the repeat. Gives back how
 * many it made.
 */
export async function topUpRepeat(
  repeat: RepeatRecord,
  options: TopUpOptions,
): Promise<number> {
  return (await topUp(repeat, options)).length;
}

/** Makes the missing events; gives back their ids. */
async function topUp(
  repeat: RepeatRecord,
  options: TopUpOptions,
): Promise<string[]> {
  const from =
    repeat.startDate > options.today ? repeat.startDate : options.today;
  const dates = repeatDates(repeat, from, windowEnd(options.today));
  if (dates.length === 0) return [];
  const found = await findOccurrences(repeat.id, dates);
  const workflows = options.workflows.filter(
    (workflow) =>
      repeat.workflowIds.includes(workflow.id) && !workflow.archived,
  );
  const missing = dates.filter((date) => !found.has(date));
  const writes = missing.flatMap((date) =>
    eventWrites(
      occurrenceId(repeat.id, date),
      occurrenceFields(repeat, date, options.formats.timeZone),
      repeat.id,
      {
        ...options,
        workflows,
        eventMaker: repeat.createdBy,
      },
    ),
  );
  await commitWrites(db, writes);
  return missing.map((date) => occurrenceId(repeat.id, date));
}

/** Makes a repeat and its events for the weeks ahead; gives back its id. */
export async function createRepeat(
  fields: SeriesFields,
  schedule: RepeatSchedule,
  workflows: readonly WorkflowRecord[],
  options: TopUpOptions,
): Promise<string> {
  const ref = doc(collection(db, Collections.repeats));
  const data = {
    ...seriesData(fields),
    ...scheduleData(schedule),
    workflowIds: workflows.map((workflow) => workflow.id),
    createdBy: options.createdBy,
    createdAt: serverTime(),
    updatedAt: serverTime(),
  };
  await commitWrites(db, [(batch) => batch.set(ref, data)]);
  const repeat: RepeatRecord = {
    id: ref.id,
    ...data,
    createdAt: null,
    updatedAt: null,
  };
  const made = await topUp(repeat, { ...options, workflows });
  await recordBulkPlan({
    kind: "repeat",
    sourceId: ref.id,
    name: fields.title,
    eventIds: made,
    byId: options.createdBy,
  });
  return ref.id;
}

/** Leaves one date out: the repeat won't make it again, and its event goes. */
export async function skipOccurrence(
  repeatId: string,
  date: string,
): Promise<void> {
  const eventId = occurrenceId(repeatId, date);
  const tasks = await tasksOf([eventId]);
  await commitWrites(db, [
    (batch) =>
      batch.update(doc(db, Collections.repeats, repeatId), {
        skipDates: arrayUnion(date),
        updatedAt: serverTime(),
      }),
    ...deleteEventWrites(
      eventId,
      tasks.map((task) => task.id),
    ),
  ]);
}

/** Ends the repeat after a date: later events and their tasks go. */
export async function endRepeatAfter(
  repeat: RepeatRecord,
  lastDate: string,
  today: string,
): Promise<number> {
  const later = [
    ...(
      await findOccurrences(
        repeat.id,
        repeatDates(repeat, addDays(lastDate, 1), windowEnd(today)),
      )
    ).keys(),
  ];
  const eventIds = later.map((date) => occurrenceId(repeat.id, date));
  const tasks = await tasksOf(eventIds);
  await commitWrites(db, [
    (batch) =>
      batch.update(doc(db, Collections.repeats, repeat.id), {
        endKind: "onDate",
        endDate: lastDate,
        endCount: null,
        updatedAt: serverTime(),
      }),
    ...eventIds.flatMap((eventId) =>
      deleteEventWrites(
        eventId,
        tasks.filter((task) => task.eventId === eventId).map((task) => task.id),
      ),
    ),
  ]);
  return eventIds.length;
}

/**
 * The schedule from its new start date on. "After N events" means N in all,
 * so the events already made before the new start come off the count; with
 * none left, the repeat ends the day before.
 */
function countFrom(
  repeat: RepeatRecord,
  schedule: RepeatSchedule,
): RepeatSchedule {
  if (
    schedule.endKind !== "afterCount" ||
    schedule.startDate <= repeat.startDate
  )
    return schedule;
  const before = addDays(schedule.startDate, -1);
  const made = repeatDates(repeat, repeat.startDate, before).length;
  const left = (schedule.endCount ?? 0) - made;
  return left > 0
    ? { ...schedule, endCount: left }
    : { ...schedule, endKind: "onDate", endDate: before, endCount: null };
}

/**
 * Changes the repeat from a date on. Upcoming events that still fall on the
 * new schedule keep their tasks: their details change, and when the time
 * changes they and their tasks move with it. Events that no longer fit are
 * removed with their tasks; new dates are made by the top-up after.
 */
export async function editSeriesFrom(
  repeat: RepeatRecord,
  fromDay: string,
  fields: SeriesFields,
  schedule: RepeatSchedule,
  options: TopUpOptions,
): Promise<void> {
  const startDate = fromDay > repeat.startDate ? fromDay : schedule.startDate;
  const series = seriesData(fields);
  const next: RepeatRecord = {
    ...repeat,
    ...series,
    ...scheduleData(countFrom(repeat, { ...schedule, startDate })),
  };
  const end = windowEnd(options.today);
  const found = await findOccurrences(
    repeat.id,
    repeatDates(repeat, fromDay, end),
  );
  const keep = new Set(repeatDates(next, fromDay, end));
  const tasks = await tasksOf(
    [...found.keys()].map((date) => occurrenceId(repeat.id, date)),
  );
  const tasksFor = (eventId: string) =>
    tasks.filter((task) => task.eventId === eventId);

  const writes: BatchWrite[] = [
    (batch) =>
      batch.update(doc(db, Collections.repeats, repeat.id), {
        ...series,
        ...scheduleData(next),
        updatedAt: serverTime(),
      }),
  ];
  for (const [date, event] of found) {
    const eventId = occurrenceId(repeat.id, date);
    if (!keep.has(date)) {
      writes.push(
        ...deleteEventWrites(
          eventId,
          tasksFor(eventId).map((task) => task.id),
        ),
      );
      continue;
    }
    const startsAt = occurrenceStart(date, next.time, options.formats.timeZone);
    const endsAt = new Date(startsAt.getTime() + next.minutes * 60_000);
    const before =
      event === "hidden"
        ? occurrenceStart(date, repeat.time, options.formats.timeZone)
        : event.startsAt;
    const shift = startsAt.getTime() - before.getTime();
    writes.push(eventDetailsWrite(eventId, fields, startsAt, endsAt));
    if (shift === 0) continue;
    for (const task of tasksFor(eventId)) {
      if (!task.dueAt) continue;
      const dueAt = new Date(task.dueAt.getTime() + shift);
      writes.push((batch) =>
        batch.update(doc(db, Collections.tasks, task.id), {
          dueAt: fromDate(dueAt),
          updatedAt: serverTime(),
        }),
      );
    }
  }
  await commitWrites(db, writes);
  await topUpRepeat(next, options);
}

/** The dates a repeat would make events on in the weeks ahead. */
export function previewRepeat(schedule: RepeatSchedule, today: string) {
  const from = schedule.startDate > today ? schedule.startDate : today;
  return repeatDates(schedule, from, windowEnd(today));
}

// #region Deleting a repeat

/** An event the deletion takes, as its kept tasks remember it. */
export interface SeriesEvent {
  id: string;
  title: string;
  startsAt: Date;
}

export interface SeriesSource {
  events: SeriesEvent[];
  tasks: TaskRecord[];
}

/**
 * The events the choice takes, and their tasks, read once. People who see
 * every event find all of a repeat's events (even ones made on an older
 * schedule); others find them by date, from the repeat's schedule.
 */
export async function readSeries(
  repeat: RepeatRecord,
  choice: SeriesChoice,
  date: string,
  today: string,
  timeZone: string,
  seesAllEvents: boolean,
): Promise<SeriesSource> {
  let events: SeriesEvent[];
  if (choice === "all" && seesAllEvents) {
    const snapshot = await getDocs(
      query(
        collection(db, Collections.events),
        where("repeatId", "==", repeat.id),
      ).withConverter(eventConverter),
    );
    events = snapshot.docs.map((entry) => {
      const event = entry.data();
      return { id: event.id, title: event.title, startsAt: event.startsAt };
    });
  } else {
    const found = await findOccurrences(
      repeat.id,
      seriesDates(repeat, choice, date, windowEnd(today)),
    );
    events = [...found].map(([day, event]) => ({
      id: occurrenceId(repeat.id, day),
      title: event === "hidden" ? repeat.title : event.title,
      startsAt:
        event === "hidden"
          ? occurrenceStart(day, repeat.time, timeZone)
          : event.startsAt,
    }));
  }
  events.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const tasks = await tasksOf(events.map((event) => event.id));
  return { events, tasks };
}

/** Commits groups of writes, never splitting a group across two batches. */
async function commitGroups(groups: readonly BatchWrite[][]): Promise<void> {
  let batch: BatchWrite[] = [];
  const flush = async () => {
    if (batch.length === 0) return;
    const writes = writeBatch(db);
    batch.forEach((write) => write(writes));
    await writes.commit();
    batch = [];
  };
  for (const group of groups) {
    if (batch.length + group.length > maxWritesPerBatch) await flush();
    batch.push(...group);
  }
  await flush();
}

/**
 * Deletes what the choice takes. Just this one skips its date; this and every
 * later one ends the repeat the day before; the whole series deletes the
 * repeat too. Each event goes with its open tasks; finished ones stay marked
 * "Event deleted" unless keepDone is off. Gives back how many events went.
 */
export async function deleteSeries(
  repeat: RepeatRecord,
  choice: SeriesChoice,
  date: string,
  source: SeriesSource,
  keepDone: boolean,
): Promise<number> {
  const plan = planSeriesDeletion(
    source.events.map((event) => event.id),
    source.tasks,
    keepDone,
  );
  const repeatRef = doc(db, Collections.repeats, repeat.id);
  const ends = choice === "all" || date <= repeat.startDate;
  const repeatWrite: BatchWrite =
    choice === "one"
      ? (batch) =>
          batch.update(repeatRef, {
            skipDates: arrayUnion(date),
            updatedAt: serverTime(),
          })
      : ends
        ? (batch) => batch.delete(repeatRef)
        : (batch) =>
            batch.update(repeatRef, {
              endKind: "onDate",
              endDate: lastDateBefore(date),
              endCount: null,
              updatedAt: serverTime(),
            });
  const kept = new Set(plan.keepTaskIds);
  const groups = source.events.map((event): BatchWrite[] => {
    const tasks = source.tasks.filter((task) => task.eventId === event.id);
    return [
      ...tasks.map((task): BatchWrite =>
        kept.has(task.id)
          ? (batch) =>
              batch.update(doc(db, Collections.tasks, task.id), {
                eventGone: {
                  title: event.title,
                  startsAt: fromDate(event.startsAt),
                },
                updatedAt: serverTime(),
              })
          : (batch) => batch.delete(doc(db, Collections.tasks, task.id)),
      ),
      (batch) => batch.delete(doc(db, Collections.events, event.id)),
    ];
  });
  // The repeat changes first, so a top-up running meanwhile doesn't make
  // the deleted dates again.
  await commitGroups([[repeatWrite], ...groups]);
  return source.events.length;
}

// #endregion

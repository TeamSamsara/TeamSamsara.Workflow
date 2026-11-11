// File : /TeamSamsara.Workflow/functions/src/maintenance/findOrphans.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The database check-up, kept free of Firebase so it can be
// tested: given plain copies of the documents, which ones point at things
// that are gone, and what fixing each takes. It never plans to delete real
// work: an open task whose event is gone is removed, a finished one is kept
// and marked "Event deleted"; tasks given to a group or person that's gone
// are unassigned; ids of deleted things are stripped from lists; and only
// old read notifications and old bookkeeping records are deleted.

export type Fix =
  | { kind: "delete"; path: string; why: string }
  | { kind: "update"; path: string; why: string; changes: Record<string, unknown> };

export type Doc = { id: string } & Record<string, unknown>;

export interface Snapshot {
  members: Doc[];
  workGroups: Doc[];
  peopleTags: Doc[];
  events: Doc[];
  repeats: Doc[];
  eventSets: Doc[];
  tasks: Doc[];
  personal: Doc[];
  busy: Doc[];
  notifications: Doc[];
  /** Throttle records ("sentReminders"), workflow syncs and planning records. */
  records: { collection: string; id: string; at: Date | null }[];
}

export interface Limits {
  now: Date;
  /** Read notifications older than this are deleted. */
  readNotificationDays: number;
  /** Bookkeeping records older than this are deleted. */
  recordDays: number;
}

export const defaultLimits = (now: Date): Limits => ({
  now,
  readNotificationDays: 90,
  recordDays: 30,
});

const day = 24 * 60 * 60 * 1000;

const ids = (docs: readonly Doc[]) => new Set(docs.map((doc) => doc.id));
const list = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : [];
const text = (value: unknown): string | null =>
  typeof value === "string" && value ? value : null;
const date = (value: unknown): Date | null =>
  value instanceof Date ? value : null;

/** The same list without the ids that are gone, or null when nothing changes. */
function strip(value: unknown, keep: (id: string) => boolean): string[] | null {
  const before = list(value);
  const after = before.filter(keep);
  return after.length === before.length ? null : after;
}

export function findOrphans(snapshot: Snapshot, limits: Limits): Fix[] {
  const fixes: Fix[] = [];
  const memberIds = ids(snapshot.members);
  const groupIds = ids(snapshot.workGroups);
  const tagIds = ids(snapshot.peopleTags);
  const eventIds = ids(snapshot.events);
  const repeatIds = ids(snapshot.repeats);
  const setIds = ids(snapshot.eventSets);
  const personalIds = ids(snapshot.personal);
  const removed = new Set(
    snapshot.members
      .filter((member) => member.status === "removed")
      .map((member) => member.id),
  );

  // Members: groups and tags that are gone.
  for (const member of snapshot.members) {
    const changes: Record<string, unknown> = {};
    const groups = strip(member.workGroupIds, (id) => groupIds.has(id));
    if (groups) changes.workGroupIds = groups;
    const tags = strip(member.tagIds, (id) => tagIds.has(id));
    if (tags) changes.tagIds = tags;
    if (Object.keys(changes).length)
      fixes.push({
        kind: "update",
        path: `members/${member.id}`,
        why: "Their groups or tags include ones that were deleted",
        changes,
      });
  }

  // Work groups: leads who are no longer members.
  for (const group of snapshot.workGroups) {
    const leads = strip(group.leadIds, (id) => memberIds.has(id) && !removed.has(id));
    if (leads)
      fixes.push({
        kind: "update",
        path: `workGroups/${group.id}`,
        why: "A lead was removed from the workspace",
        changes: { leadIds: leads },
      });
  }

  // Events and repeats: groups and people who are gone, and a lost repeat or set.
  const audience = (doc: Doc, kind: string) => {
    const changes: Record<string, unknown> = {};
    const groups = strip(doc.groupIds, (id) => groupIds.has(id));
    if (groups) changes.groupIds = groups;
    const people = strip(doc.memberIds, (id) => memberIds.has(id));
    if (people) changes.memberIds = people;
    const required = strip(doc.requiredIds, (id) => memberIds.has(id));
    if (required) changes.requiredIds = required;
    if (kind === "events") {
      const repeat = text(doc.repeatId);
      if (repeat && !repeatIds.has(repeat)) changes.repeatId = null;
      const set = text(doc.setId);
      if (set && !setIds.has(set)) changes.setId = null;
    }
    if (Object.keys(changes).length)
      fixes.push({
        kind: "update",
        path: `${kind}/${doc.id}`,
        why: "It points at groups, people, a repeat or a set that were deleted",
        changes,
      });
  };
  snapshot.events.forEach((event) => audience(event, "events"));
  snapshot.repeats.forEach((repeat) => audience(repeat, "repeats"));

  // Tasks: their event, group or person is gone.
  for (const task of snapshot.tasks) {
    const path = `tasks/${task.id}`;
    const done = date(task.doneAt) !== null;
    const event = text(task.eventId);
    if (event && !eventIds.has(event)) {
      if (!done) {
        fixes.push({ kind: "delete", path, why: "Its event was deleted and it isn't finished" });
        continue;
      }
      if (!task.eventGone) {
        fixes.push({
          kind: "update",
          path,
          why: "Its event was deleted; kept as finished history",
          changes: { eventGone: { title: "An event", startsAt: null } },
        });
      }
    }
    if (done) continue;
    const changes: Record<string, unknown> = {};
    const group = text(task.workGroupId);
    if (group && !groupIds.has(group)) changes.workGroupId = null;
    const person = text(task.memberId);
    if (person && (!memberIds.has(person) || removed.has(person)))
      changes.memberId = null;
    if (Object.keys(changes).length)
      fixes.push({
        kind: "update",
        path,
        why: "It's given to a group or person that's gone, so it's unassigned",
        changes,
      });
  }

  // Personal appointments shared with people who are gone; busy copies without their appointment.
  for (const entry of snapshot.personal) {
    const shared = strip(entry.visibleTo, (id) => memberIds.has(id) && !removed.has(id));
    if (shared)
      fixes.push({
        kind: "update",
        path: `personal/${entry.id}`,
        why: "It was shared with someone who's gone",
        changes: { visibleTo: shared },
      });
  }
  for (const entry of snapshot.busy) {
    if (!personalIds.has(entry.id))
      fixes.push({ kind: "delete", path: `busy/${entry.id}`, why: "Its appointment was deleted" });
  }

  // Old read notifications, and notifications for people who are gone.
  const oldRead = limits.now.getTime() - limits.readNotificationDays * day;
  for (const note of snapshot.notifications) {
    const read = date(note.readAt);
    const owner = text(note.memberId);
    if (owner && !memberIds.has(owner))
      fixes.push({ kind: "delete", path: `notifications/${note.id}`, why: "Its person is gone" });
    else if (read && read.getTime() < oldRead)
      fixes.push({
        kind: "delete",
        path: `notifications/${note.id}`,
        why: `Read more than ${limits.readNotificationDays} days ago`,
      });
  }

  // Bookkeeping that has done its job.
  const oldRecord = limits.now.getTime() - limits.recordDays * day;
  for (const record of snapshot.records) {
    if (record.at && record.at.getTime() < oldRecord)
      fixes.push({
        kind: "delete",
        path: `${record.collection}/${record.id}`,
        why: `Bookkeeping older than ${limits.recordDays} days`,
      });
  }

  return fixes;
}

/** Counts per collection and kind, and a few examples each, for the report. */
export function summarize(fixes: readonly Fix[], examplesEach = 3) {
  const counts: Record<string, number> = {};
  const examples: Record<string, string[]> = {};
  for (const fix of fixes) {
    const key = `${fix.path.split("/")[0]}.${fix.kind}`;
    counts[key] = (counts[key] ?? 0) + 1;
    const shown = (examples[key] ??= []);
    if (shown.length < examplesEach) shown.push(`${fix.path}: ${fix.why}`);
  }
  return { counts, examples };
}

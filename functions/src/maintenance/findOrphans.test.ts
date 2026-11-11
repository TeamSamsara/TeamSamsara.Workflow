// File : /TeamSamsara.Workflow/functions/src/maintenance/findOrphans.test.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tests the database check-up: what points at deleted things, what
// fixing it takes, and that real work is never deleted.

import { describe, expect, it } from "vitest";
import { defaultLimits, findOrphans, summarize, type Snapshot } from "./findOrphans.js";

const now = new Date("2026-11-15T09:00:00Z");
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);

const empty: Snapshot = {
  members: [],
  workGroups: [],
  peopleTags: [],
  events: [],
  repeats: [],
  eventSets: [],
  tasks: [],
  personal: [],
  busy: [],
  notifications: [],
  records: [],
};

const base: Snapshot = {
  ...empty,
  members: [
    { id: "okami", status: "active", workGroupIds: ["bloom", "gone"], tagIds: ["starter", "oldTag"] },
    { id: "fliptik", status: "removed", workGroupIds: [] },
  ],
  workGroups: [{ id: "bloom", leadIds: ["okami", "fliptik"] }],
  peopleTags: [{ id: "starter" }],
  events: [{ id: "match", groupIds: ["bloom", "gone"], memberIds: [], repeatId: "lost", setId: null }],
  tasks: [
    { id: "open", eventId: "deleted", doneAt: null },
    { id: "done", eventId: "deleted", doneAt: daysAgo(3) },
    { id: "history", eventId: "deleted", doneAt: daysAgo(3), eventGone: { title: "Practice" } },
    { id: "orphanGroup", eventId: null, workGroupId: "gone", memberId: "fliptik", doneAt: null },
    { id: "fine", eventId: "match", workGroupId: "bloom", memberId: "okami", doneAt: null },
  ],
};

describe("findOrphans", () => {
  const fixes = findOrphans(base, defaultLimits(now));
  const forPath = (path: string) => fixes.filter((fix) => fix.path === path);

  it("strips deleted groups and tags from members", () => {
    expect(forPath("members/okami")).toEqual([
      expect.objectContaining({
        kind: "update",
        changes: { workGroupIds: ["bloom"], tagIds: ["starter"] },
      }),
    ]);
  });

  it("removes leads who left, and lost groups and repeats from events", () => {
    expect(forPath("workGroups/bloom")[0]).toMatchObject({ changes: { leadIds: ["okami"] } });
    expect(forPath("events/match")[0]).toMatchObject({
      changes: { groupIds: ["bloom"], repeatId: null },
    });
  });

  it("deletes open tasks of deleted events but keeps finished ones as history", () => {
    expect(forPath("tasks/open")).toEqual([expect.objectContaining({ kind: "delete" })]);
    expect(forPath("tasks/done")).toEqual([
      expect.objectContaining({ kind: "update", changes: { eventGone: { title: "An event", startsAt: null } } }),
    ]);
    expect(forPath("tasks/history")).toEqual([]);
  });

  it("unassigns tasks given to a group or person that's gone", () => {
    expect(forPath("tasks/orphanGroup")[0]).toMatchObject({
      kind: "update",
      changes: { workGroupId: null, memberId: null },
    });
    expect(forPath("tasks/fine")).toEqual([]);
  });

  it("deletes old read notifications, lost busy copies and old records only", () => {
    const tidy = findOrphans(
      {
        ...empty,
        members: [{ id: "okami" }],
        personal: [{ id: "p1", visibleTo: ["okami", "gone"] }],
        busy: [{ id: "p1" }, { id: "p2" }],
        notifications: [
          { id: "old", memberId: "okami", readAt: daysAgo(120) },
          { id: "recent", memberId: "okami", readAt: daysAgo(10) },
          { id: "unread", memberId: "okami", readAt: null },
        ],
        records: [
          { collection: "sentReminders", id: "a", at: daysAgo(40) },
          { collection: "workflowSyncs", id: "b", at: daysAgo(2) },
        ],
      },
      defaultLimits(now),
    );
    expect(tidy.map((fix) => `${fix.kind} ${fix.path}`).sort()).toEqual([
      "delete busy/p2",
      "delete notifications/old",
      "delete sentReminders/a",
      "update personal/p1",
    ]);
  });

  it("finds nothing in a tidy database", () => {
    expect(findOrphans(empty, defaultLimits(now))).toEqual([]);
  });
});

describe("summarize", () => {
  it("counts by collection and kind with a few examples", () => {
    const summary = summarize(findOrphans(base, defaultLimits(now)));
    expect(summary.counts["tasks.delete"]).toBe(1);
    expect(summary.counts["tasks.update"]).toBe(2);
    expect(summary.examples["tasks.delete"][0]).toContain("tasks/open");
  });
});

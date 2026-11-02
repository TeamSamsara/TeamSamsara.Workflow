// File : /TeamSamsara.Workflow/functions/src/model.test.ts
// Version : 1.1.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : Tests who a task or event change notifies, and when reminders fire.

import { describe, expect, it } from "vitest";
import {
  eventNotifications,
  isDueIn,
  readSettings,
  reminderAt,
  replyNotifications,
  taskNotifications,
  waitingOn,
  type EventData,
  type TaskData,
} from "./model.js";

const task = (changes: Partial<TaskData> = {}): TaskData => ({
  title: "Thumbnail",
  memberId: null,
  workGroupId: "design",
  eventId: "match",
  sentForReviewBy: null,
  sentForReviewAt: null,
  approvedAt: null,
  changesRequested: null,
  dueAt: null,
  doneAt: null,
  ...changes,
});

describe("taskNotifications", () => {
  it("tells the group about a new task, or the person it's given to", () => {
    expect(taskNotifications(null, task())).toEqual([
      { kind: "taskGiven", to: { group: "design" } },
    ]);
    expect(taskNotifications(task(), task({ memberId: "sam" }))).toEqual([
      { kind: "taskGiven", to: { member: "sam" } },
    ]);
  });

  it("asks the approvers, then tells the worker how it went", () => {
    const sent = task({
      memberId: "sam",
      sentForReviewBy: "sam",
      sentForReviewAt: new Date(1),
    });
    expect(taskNotifications(task({ memberId: "sam" }), sent)).toEqual([
      { kind: "reviewAsked", to: { approvers: true } },
    ]);
    expect(
      taskNotifications(sent, { ...sent, changesRequested: "Trim the intro" }),
    ).toEqual([
      { kind: "changesAsked", to: { member: "sam" }, detail: "Trim the intro" },
    ]);
    expect(
      taskNotifications(sent, { ...sent, approvedAt: new Date(2) }),
    ).toEqual([{ kind: "taskApproved", to: { member: "sam" } }]);
  });

  it("says nothing about finished tasks or untouched ones", () => {
    expect(taskNotifications(task(), task({ doneAt: new Date() }))).toEqual([]);
    expect(taskNotifications(task(), task({ title: "New title" }))).toEqual([]);
    expect(taskNotifications(task(), null)).toEqual([]);
  });
});

describe("eventNotifications", () => {
  const now = new Date("2026-11-02T12:00:00Z");
  const members = [
    { id: "sam", workGroupIds: ["bloom"] },
    { id: "mika", workGroupIds: ["bloom"] },
    { id: "rio", workGroupIds: [] },
  ];
  const event = (changes: Partial<EventData> = {}): EventData => ({
    title: "vs. Kitsune",
    startsAt: new Date("2026-11-14T00:00:00Z"),
    everyone: false,
    groupIds: ["bloom"],
    memberIds: [],
    repeatId: null,
    setId: null,
    createdBy: "pat",
    asksReply: false,
    requiredIds: [],
    tellEveryReply: false,
    replies: {},
    ...changes,
  });

  it("asks people to reply instead when the event asks", () => {
    expect(
      eventNotifications(null, event({ asksReply: true }), members, now),
    ).toEqual([{ kind: "replyAsked", memberIds: ["sam", "mika"] }]);
    // Turning asking on later asks those in it who haven't replied.
    expect(
      eventNotifications(
        event(),
        event({
          asksReply: true,
          replies: { sam: { answer: "going", note: "" } },
        }),
        members,
        now,
      ),
    ).toEqual([{ kind: "replyAsked", memberIds: ["mika"] }]);
  });

  it("tells the planner when someone required can't go", () => {
    const asking = event({ asksReply: true, requiredIds: ["sam"] });
    const declined = {
      ...asking,
      replies: {
        sam: { answer: "cant" as const, note: "Away" },
        mika: { answer: "cant" as const, note: "" },
      },
    };
    expect(replyNotifications(asking, declined)).toEqual([
      { kind: "replyDeclined", memberId: "sam", answer: "cant", note: "Away" },
    ]);
    // A note changed without a new answer says nothing.
    expect(replyNotifications(declined, declined)).toEqual([]);
  });

  it("tells the planner about every reply when asked to", () => {
    const asking = event({ asksReply: true, tellEveryReply: true });
    expect(
      replyNotifications(asking, {
        ...asking,
        replies: { mika: { answer: "maybe", note: "" } },
      }),
    ).toEqual([
      { kind: "replied", memberId: "mika", answer: "maybe", note: "" },
    ]);
  });

  it("knows who it's still waiting on", () => {
    expect(
      waitingOn(
        event({ replies: { sam: { answer: "going", note: "" } } }),
        members,
      ),
    ).toEqual(["mika"]);
  });

  it("tells everyone in a new event, but not for repeats, sets or the past", () => {
    expect(eventNotifications(null, event(), members, now)).toEqual([
      { kind: "eventAdded", memberIds: ["sam", "mika"] },
    ]);
    expect(
      eventNotifications(null, event({ repeatId: "r" }), members, now),
    ).toEqual([]);
    expect(
      eventNotifications(null, event({ setId: "s" }), members, now),
    ).toEqual([]);
    expect(
      eventNotifications(
        null,
        event({ startsAt: new Date("2026-11-01") }),
        members,
        now,
      ),
    ).toEqual([]);
  });

  it("tells newcomers they're in, and those already in that it moved", () => {
    const moved = event({
      memberIds: ["rio"],
      startsAt: new Date("2026-11-15T00:00:00Z"),
    });
    expect(eventNotifications(event(), moved, members, now)).toEqual([
      { kind: "eventAdded", memberIds: ["rio"] },
      { kind: "eventMoved", memberIds: ["sam", "mika"] },
    ]);
  });

  it("tells them it's cancelled when it's soon", () => {
    expect(eventNotifications(event(), null, members, now)).toEqual([
      { kind: "eventCancelled", memberIds: ["sam", "mika"] },
    ]);
    expect(
      eventNotifications(
        event({ startsAt: new Date("2027-03-01") }),
        null,
        members,
        now,
      ),
    ).toEqual([]);
  });
});

describe("reminders", () => {
  const due = new Date("2026-11-14T00:00:00Z"); // 7:00 PM Nov 13 in Toronto

  it("counts back from the time, or to 9 AM the day before there", () => {
    expect(reminderAt(due, "2h", "America/Toronto")?.toISOString()).toBe(
      "2026-11-13T22:00:00.000Z",
    );
    expect(reminderAt(due, "dayBefore", "America/Toronto")?.toISOString()).toBe(
      "2026-11-12T14:00:00.000Z",
    );
    expect(reminderAt(due, "off", "America/Toronto")).toBeNull();
  });

  it("fires in the run that covers it, once", () => {
    const at = new Date("2026-11-13T22:00:00Z");
    expect(
      isDueIn(
        at,
        new Date("2026-11-13T21:45:00Z"),
        new Date("2026-11-13T22:00:00Z"),
      ),
    ).toBe(true);
    expect(
      isDueIn(
        at,
        new Date("2026-11-13T22:00:00Z"),
        new Date("2026-11-13T22:15:00Z"),
      ),
    ).toBe(false);
  });

  it("reads settings with defaults for anything missing", () => {
    expect(
      readSettings({ email: { given: true }, taskReminder: "nope" }),
    ).toMatchObject({
      app: { given: true, mine: true, review: true, events: true },
      email: { given: true, review: true },
      taskReminder: "2h",
      eventReminder: "1h",
    });
  });
});

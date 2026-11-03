// File : /TeamSamsara.Workflow/app/src/features/notifications/model/notificationText.test.ts
// Version : 1.1.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : Tests how notifications read, and when they say they happened.

import { describe, expect, it } from "vitest";
import { byDay, notificationLine, timeAgo } from "./notificationText";

const note = (
  kind: Parameters<typeof notificationLine>[0]["kind"],
  detail: string | null = null,
) => ({
  kind,
  title: "Thumbnail vs Kitsune",
  detail,
  groupId: null,
});

describe("notificationLine", () => {
  it("says who did what to which task", () => {
    expect(notificationLine(note("taskGiven"), "Jordan", null)).toMatchObject({
      who: "Jordan",
      what: "gave you",
      thing: "Thumbnail vs Kitsune",
      rest: ".",
    });
    expect(notificationLine(note("taskGiven"), "Jordan", "Design").rest).toBe(
      " to Design.",
    );
    expect(
      notificationLine(note("changesAsked", "Trim the intro"), "Alex", null)
        .quote,
    ).toBe("Trim the intro");
  });

  it("leaves out who for reminders and moves", () => {
    expect(
      notificationLine(note("taskDue", "Sat, Nov 14, 7:00 PM"), null, null),
    ).toMatchObject({ who: null, rest: " is due Sat, Nov 14, 7:00 PM." });
    expect(notificationLine(note("eventAdded"), null, null).what).toBe(
      "You're in",
    );
  });

  it("words replies to events", () => {
    expect(
      notificationLine(
        note("replyAsked", "Sat, Nov 14, 7:00 PM"),
        "Jordan",
        null,
      ),
    ).toMatchObject({
      what: "asked you to reply to",
      rest: " · Sat, Nov 14, 7:00 PM.",
    });
    expect(
      notificationLine(note("replyDeclined", "Away"), "Lena", null),
    ).toMatchObject({ who: "Lena", what: "can't go to", quote: "Away" });
    expect(
      notificationLine({ ...note("replied"), answer: "maybe" }, "Sora", null)
        .what,
    ).toBe("replied Maybe to");
  });
});

describe("timeAgo and byDay", () => {
  const now = new Date("2026-11-02T18:00:00Z");
  const dayOf = (date: Date) => date.toISOString().slice(0, 10);
  const text = () => "Oct 30";

  it("counts minutes and hours today, then yesterday, then a date", () => {
    expect(timeAgo(new Date("2026-11-02T17:55:00Z"), now, dayOf, text)).toBe(
      "5 min ago",
    );
    expect(timeAgo(new Date("2026-11-02T15:00:00Z"), now, dayOf, text)).toBe(
      "3 h ago",
    );
    expect(timeAgo(new Date("2026-11-01T15:00:00Z"), now, dayOf, text)).toBe(
      "Yesterday",
    );
    expect(timeAgo(new Date("2026-10-30T15:00:00Z"), now, dayOf, text)).toBe(
      "Oct 30",
    );
  });

  it("splits today's from earlier ones", () => {
    const groups = byDay(
      [
        { createdAt: new Date("2026-11-02T10:00:00Z") },
        { createdAt: new Date("2026-10-30T10:00:00Z") },
      ],
      now,
      dayOf,
    );
    expect(groups.map((group) => [group.key, group.items.length])).toEqual([
      ["today", 1],
      ["earlier", 1],
    ]);
  });
});

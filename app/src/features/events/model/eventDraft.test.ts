// File : /TeamSamsara.Workflow/app/src/features/events/model/eventDraft.test.ts
// Version : 1.0.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : Tests an event's start and end in its form: the end follows the
// start, an end before the start is the next day, and back to real times.

import { describe, expect, it } from "vitest";
import {
  draftMinutes,
  emptyEventDraft,
  fieldsFromDraft,
  withStartTime,
} from "./eventDraft";

describe("event times", () => {
  it("lasts two hours to start with", () => {
    const draft = emptyEventDraft("2026-11-03");
    expect(draft).toMatchObject({ time: "19:00", endTime: "21:00" });
    expect(draftMinutes(draft)).toBe(120);
  });

  it("keeps its length when the start moves", () => {
    const draft = { ...emptyEventDraft("2026-11-03"), endTime: "20:30" };
    expect(withStartTime(draft, "18:00")).toMatchObject({
      time: "18:00",
      endTime: "19:30",
    });
    expect(withStartTime(draft, "23:00").endTime).toBe("00:30");
  });

  it("ends the next day when the end is before the start", () => {
    const draft = {
      ...emptyEventDraft("2026-11-03"),
      time: "22:00",
      endTime: "01:00",
    };
    expect(draftMinutes(draft)).toBe(180);
    const fields = fieldsFromDraft(draft, "America/Toronto");
    expect(fields?.startsAt.toISOString()).toBe("2026-11-04T03:00:00.000Z");
    expect(fields?.endsAt.toISOString()).toBe("2026-11-04T06:00:00.000Z");
  });
});

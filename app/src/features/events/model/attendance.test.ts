// File : /TeamSamsara.Workflow/app/src/features/events/model/attendance.test.ts
// Version : 1.0.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : Tests who an event asks to reply, the counts, and who's required.

import { describe, expect, it } from "vitest";
import {
  attendanceSummary,
  isAsked,
  myReply,
  peopleIn,
  requiredAfter,
} from "./attendance";

const people = [
  { id: "mika", workGroupIds: ["bloom"] },
  { id: "jun", workGroupIds: ["bloom"] },
  { id: "rio", workGroupIds: [] },
  { id: "kai", workGroupIds: ["staff"] },
];

const event = {
  everyone: false,
  groupIds: ["bloom"],
  memberIds: ["rio"],
  asksReply: true,
  requiredIds: ["mika", "jun"],
  tellEveryReply: false,
  replies: {
    mika: { answer: "going" as const, note: "", at: null },
    rio: { answer: "cant" as const, note: "Away", at: null },
  },
};

describe("attendance", () => {
  it("finds the people in an event through groups and by name", () => {
    expect(peopleIn(event, people).map((p) => p.id)).toEqual([
      "mika",
      "jun",
      "rio",
    ]);
    expect(peopleIn({ ...event, everyone: true }, people)).toHaveLength(4);
  });

  it("asks only the people in it, and only when it asks", () => {
    expect(isAsked(event, people[0])).toBe(true);
    expect(isAsked(event, people[3])).toBe(false);
    expect(isAsked({ ...event, asksReply: false }, people[0])).toBe(false);
  });

  it("counts replies and splits required from optional", () => {
    const summary = attendanceSummary(event, people);
    expect(summary.counts).toEqual({ going: 1, maybe: 0, cant: 1, waiting: 1 });
    expect(summary.required.map((entry) => entry.person.id)).toEqual([
      "mika",
      "jun",
    ]);
    expect(summary.optional.map((entry) => entry.person.id)).toEqual(["rio"]);
    expect(summary.waitingIds).toEqual(["jun"]);
  });

  it("gives the member's own reply", () => {
    expect(myReply(event, people[0])).toBe("going");
    expect(myReply(event, people[1])).toBe("waiting");
    expect(myReply(event, people[3])).toBeNull();
  });

  it("makes everyone required when asking starts, and later people optional", () => {
    const on = { asksReply: true, requiredIds: [], tellEveryReply: false };
    expect(requiredAfter(on, false, ["a", "b"])).toEqual(["a", "b"]);
    expect(
      requiredAfter({ ...on, requiredIds: ["a", "b"] }, true, ["a", "c"]),
    ).toEqual(["a"]);
    expect(requiredAfter({ ...on, asksReply: false }, true, ["a"])).toEqual([]);
  });
});

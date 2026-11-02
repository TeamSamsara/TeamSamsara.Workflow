// File : /TeamSamsara.Workflow/app/src/features/events/model/planDraft.test.ts
// Version : 1.0.0
// Latest commit: feature/event-sets
// Author : Gerrah
// Purpose : Tests planning several events: the columns, each row's title (TBD
// gaps kept), what's wrong, patterns and each row's event.

import { describe, expect, it } from "vitest";
import {
  checkPlan,
  emptyPlan,
  nextRow,
  patternDates,
  planGaps,
  rowFields,
  rowTitle,
  sortRows,
  type PlanRow,
} from "./planDraft";

const row = (changes: Partial<PlanRow> = {}): PlanRow => ({
  key: "a",
  date: "2027-01-09",
  time: "17:00",
  endTime: "19:00",
  values: {},
  ...changes,
});

describe("columns and titles", () => {
  it("takes the title's gaps, then the workflows', each once", () => {
    expect(
      planGaps("vs. {opponent} ({round})", ["opponent", "caster"]),
    ).toEqual(["opponent", "round", "caster"]);
    expect(planGaps("{title} on {date}", [])).toEqual([]);
  });

  it("fills the title and keeps TBD gaps", () => {
    expect(
      rowTitle("vs. {opponent}", row({ values: { opponent: " Nova " } })),
    ).toBe("vs. Nova");
    expect(rowTitle("vs. {opponent}", row({ values: { opponent: "" } }))).toBe(
      "vs. {opponent}",
    );
  });
});

describe("checking", () => {
  it("needs a name, a title and rows with dates", () => {
    const problems = checkPlan(
      { ...emptyPlan(), rows: [row({ date: "" })] },
      "America/Toronto",
    );
    expect(problems.name).toBeTruthy();
    expect(problems.title).toBeTruthy();
    expect(problems.byRow.get("a")?.date).toBeTruthy();
    expect(problems.count).toBe(3);
  });

  it("accepts a plan with TBD gaps", () => {
    const draft = {
      ...emptyPlan(),
      name: "Spring Split",
      titlePattern: "vs. {opponent}",
      rows: [row()],
    };
    expect(checkPlan(draft, "America/Toronto").count).toBe(0);
  });
});

describe("rows", () => {
  it("adds the next row a week later at the same times", () => {
    const draft = { ...emptyPlan(), rows: [row()] };
    expect(nextRow(draft)).toMatchObject({
      date: "2027-01-16",
      time: "17:00",
      endTime: "19:00",
    });
  });

  it("sorts by date and time, undated last", () => {
    const sorted = sortRows([
      row({ key: "c", date: "" }),
      row({ key: "b", date: "2027-01-09", time: "20:00" }),
      row({ key: "a", date: "2027-01-09", time: "17:00" }),
    ]);
    expect(sorted.map((entry) => entry.key)).toEqual(["a", "b", "c"]);
  });

  it("finds the dates of a pattern, every week or every other", () => {
    const pattern = {
      weekdays: [6],
      every: 1,
      from: "2027-01-09",
      until: "2027-02-06",
      time: "17:00",
      endTime: "19:00",
    };
    expect(patternDates(pattern)).toEqual([
      "2027-01-09",
      "2027-01-16",
      "2027-01-23",
      "2027-01-30",
      "2027-02-06",
    ]);
    expect(patternDates({ ...pattern, every: 2 })).toEqual([
      "2027-01-09",
      "2027-01-23",
      "2027-02-06",
    ]);
  });

  it("makes each row's event in the workspace's time zone", () => {
    const draft = {
      ...emptyPlan(),
      name: "Split",
      titlePattern: "vs. {opponent}",
    };
    const fields = rowFields(
      draft,
      row({ values: { opponent: "Nova", round: "" } }),
      "America/Toronto",
    );
    expect(fields?.title).toBe("vs. Nova");
    expect(fields?.details).toEqual({ opponent: "Nova" });
    expect(fields?.startsAt.toISOString()).toBe("2027-01-09T22:00:00.000Z");
    expect(fields?.endsAt.toISOString()).toBe("2027-01-10T00:00:00.000Z");
  });
});

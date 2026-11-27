// File : /TeamSamsara.Workflow/app/src/features/workflows/model/orderRules.test.ts
// Version : 1.0.0
// Latest commit: feature/1.2-order-rules
// Author : Gerrah
// Purpose : Tests order rules: links in both directions, loops, steps due too
// early (with a fix), conditions a step can't meet, the dropdown choices and
// the Reads-as sentence.

import { describe, expect, it } from "vitest";
import type {
  DueOffset,
  OrderRule,
  WorkflowStep,
} from "../types/workflowTypes";
import { newStep } from "./workflowDraft";
import {
  byDue,
  conditionChoices,
  dueAfter,
  linksOf,
  orderLinks,
  orderProblems,
  readsAs,
  stepChoices,
  wouldLoop,
} from "./orderRules";

const before = (days: number, time: string | null): DueOffset => ({
  direction: "before",
  days,
  hours: 0,
  minutes: 0,
  time,
});
const after = (days: number, time: string | null): DueOffset => ({
  direction: "after",
  days,
  hours: 0,
  minutes: 0,
  time,
});
const rule = (
  stepId: string,
  relation: OrderRule["relation"] = "after",
  condition: OrderRule["condition"] = "done",
): OrderRule => ({
  id: `r-${stepId}-${relation}`,
  relation,
  stepId,
  condition,
});
const step = (
  id: string,
  title: string,
  due: DueOffset,
  extra: Partial<WorkflowStep> = {},
): WorkflowStep => ({ ...newStep(), id, title, due, ...extra });
const untitled = (index: number) => `Task ${index + 1}`;

// The Product launch workflow from the designs.
const flyers = step("flyers", "Print the flyers", before(2, "15:00"));
const banner = step("banner", "Launch banner", before(1, "12:00"), {
  needsApproval: true,
  priority: "high",
});
const post = step("post", "Announcement post", before(1, "17:00"), {
  order: [
    rule("banner", "after", "approved"),
    rule("flyers", "after", "order"),
    rule("recap", "before", "done"),
  ],
});
const photos = step("photos", "Edit the launch photos", after(1, "13:00"));
const recap = step("recap", "Share the recap", after(1, "13:00"), {
  order: [rule("photos")],
});
const launch = [flyers, banner, post, photos, recap];

describe("orderLinks", () => {
  it("turns each rule into a link, both directions", () => {
    const links = orderLinks(launch).map(
      (link) => `${link.from}>${link.to}:${link.condition}`,
    );
    expect(links).toEqual([
      "banner>post:approved",
      "flyers>post:order",
      "post>recap:done",
      "photos>recap:done",
    ]);
  });

  it("leaves out rules with no step, on itself, or to a step that's gone", () => {
    const lonely = step("a", "A", before(1, null), {
      order: [rule(""), rule("a"), rule("gone")],
    });
    expect(orderLinks([lonely])).toEqual([]);
  });
});

describe("wouldLoop", () => {
  it("finds a rule that would close a loop", () => {
    // recap already comes after post, so post coming after recap loops.
    expect(wouldLoop(launch, "post", "recap", "after")).toBe(true);
    expect(wouldLoop(launch, "flyers", "post", "after")).toBe(true);
    expect(wouldLoop(launch, "photos", "flyers", "after")).toBe(false);
  });

  it("ignores the rule being edited", () => {
    expect(wouldLoop(launch, "post", "recap", "before", "r-recap-before")).toBe(
      false,
    );
  });
});

describe("orderProblems", () => {
  it("flags a step due at the same moment as one it comes after, with a fix", () => {
    const problems = orderProblems(launch, untitled);
    expect(problems.recap).toHaveLength(1);
    expect(problems.recap[0].message).toContain(
      "same moment as 4. Edit the launch photos",
    );
    expect(problems.recap[0].fix).toEqual(after(1, "14:00"));
    expect(problems.post).toBeUndefined();
  });

  it("flags a loop once", () => {
    const a = step("a", "A", before(2, null), { order: [rule("b")] });
    const b = step("b", "B", before(1, null), { order: [rule("a")] });
    const problems = orderProblems([a, b], untitled);
    const all = Object.values(problems).flat();
    expect(
      all.filter((problem) => problem.message.includes("wait on each other")),
    ).toHaveLength(1);
  });

  it("flags approval asked of a step that doesn't need it", () => {
    const plain = { ...banner, needsApproval: false };
    const problems = orderProblems(
      [flyers, plain, post, photos, recap],
      untitled,
    );
    expect(problems.post?.[0].message).toContain("doesn't need approval");
  });
});

describe("dropdown choices", () => {
  it("greys out steps already in a rule or that would loop", () => {
    const fresh = rule("", "after");
    const editing = { ...post, order: [...post.order, fresh] };
    const steps = [flyers, banner, editing, photos, recap];
    const choices = stepChoices(steps, editing, fresh, untitled);
    const byValue = Object.fromEntries(
      choices.map((choice) => [choice.value, choice]),
    );
    expect(byValue.flyers.disabled).toBe(true);
    expect(byValue.banner.disabled).toBe(true);
    expect(byValue.recap.disabled).toBe(true);
    expect(byValue.photos.disabled).toBeUndefined();
    expect(byValue.photos.label).toContain("not due before this one");
  });

  it("offers approval conditions only when the first step needs approval", () => {
    const withApproval = conditionChoices("after", banner);
    expect(
      withApproval.find((choice) => choice.value === "approved")?.disabled,
    ).toBe(false);
    const without = conditionChoices("after", flyers);
    expect(
      without.find((choice) => choice.value === "approved")?.disabled,
    ).toBe(true);
    expect(conditionChoices("with", flyers)).toHaveLength(1);
  });
});

describe("dueAfter", () => {
  it("moves a clock time an hour on, and a relative time an hour later", () => {
    expect(dueAfter(before(1, "12:00"))).toEqual(before(1, "13:00"));
    expect(
      dueAfter({
        direction: "before",
        days: 0,
        hours: 2,
        minutes: 0,
        time: null,
      }),
    ).toEqual({
      direction: "before",
      days: 0,
      hours: 1,
      minutes: 0,
      time: null,
    });
    expect(
      dueAfter({ direction: "at", days: 0, hours: 0, minutes: 0, time: null })
        .direction,
    ).toBe("after");
  });
});

describe("linksOf and readsAs", () => {
  it("lists the links into and out of a step", () => {
    const links = linksOf(launch, "post", untitled);
    expect(
      links.map((link) => `${link.incoming ? "in" : "out"}:${link.name}`),
    ).toEqual([
      "in:2. Launch banner",
      "in:1. Print the flyers",
      "out:5. Share the recap",
    ]);
  });

  it("says what the step will do", () => {
    const text = readsAs(launch, post, {
      who: "Marketing's least busy person",
      clockFormat: "12h",
      untitled,
    })
      .map((part) => part.text)
      .join("");
    expect(text).toContain(
      "Marketing's least busy person gets this the day before at 5:00 PM.",
    );
    expect(text).toContain(
      "It stays locked until 2. Launch banner is approved.",
    );
    expect(text).toContain("It's due after 1. Print the flyers.");
    expect(text).toContain(
      "5. Share the recap can't start until this is done.",
    );
    expect(text).toContain("Normal priority, no approval.");
  });
});

describe("byDue", () => {
  it("sorts by due time and keeps ties in order", () => {
    const shuffled = [recap, banner, photos, flyers, post];
    expect(byDue(shuffled).map((entry) => entry.id)).toEqual([
      "flyers",
      "banner",
      "post",
      "recap",
      "photos",
    ]);
  });
});

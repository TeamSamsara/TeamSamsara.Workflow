// File : /TeamSamsara.Workflow/app/src/features/workflows/model/placeholders.test.ts
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : Tests finding and filling {gaps}, and listing the ones a workflow uses.

import { describe, expect, it } from "vitest";
import { newStep } from "./workflowDraft";
import { fillGaps, findGaps, workflowGaps } from "./placeholders";

describe("findGaps", () => {
  it("finds each gap once, lower-cased", () => {
    expect(
      findGaps("We're live! {title} with {Guest}. {guest} {link}"),
    ).toEqual(["title", "guest", "link"]);
  });

  it("ignores braces that aren't gaps", () => {
    expect(
      findGaps("{} { title } {1st} {a very long gap name that is too long}"),
    ).toEqual([]);
  });
});

describe("fillGaps", () => {
  it("fills known gaps and keeps the rest", () => {
    expect(
      fillGaps("{Title} with {guest} at {time} {extra}", {
        title: "Ranked night",
        guest: "Mika",
        time: "7:00 PM",
      }),
    ).toBe("Ranked night with Mika at 7:00 PM {extra}");
  });

  it("fills an empty value as empty", () => {
    expect(fillGaps("Hi {guest}!", { guest: "" })).toBe("Hi !");
  });
});

describe("workflowGaps", () => {
  it("splits the event's own gaps from the ones to ask for", () => {
    const post = {
      ...newStep(),
      title: "Go-live post for {title}",
      posts: [
        {
          platformId: "x",
          formatId: null,
          texts: { post: "Live with {guest}: {link}" },
        },
      ],
    };
    const brief = {
      ...newStep(),
      notes: "Ask {sponsor} for the logo",
      checklist: [{ id: "a", text: "Thumbnail with {guest}" }],
    };
    expect(workflowGaps([post, brief])).toEqual({
      fromEvent: ["title", "link"],
      asked: ["guest", "sponsor"],
    });
  });
});

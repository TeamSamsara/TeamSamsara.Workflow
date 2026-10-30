// File : /TeamSamsara.Workflow/app/src/features/workflows/model/guide.test.ts
// Version : 1.1.0
// Latest commit: fix/general-wording
// Author : Gerrah
// Purpose : Tests the guide's suggested due times and the workflow it makes.

import { describe, expect, it } from "vitest";
import { describeDue } from "./dueOffset";
import { giveToValue, parseGiveTo } from "./giveTo";
import { guideTask, guideToWorkflow } from "./guide";

describe("guideTask", () => {
  it("uses the usual due time for a suggested task", () => {
    expect(describeDue(guideTask("announcement post").due, "12h")).toBe(
      "2 days before",
    );
    expect(describeDue(guideTask(" Results post ").due, "12h")).toBe(
      "1 hour after",
    );
  });

  it("starts other tasks as due the day before", () => {
    const task = guideTask("  Book the venue ");
    expect(task.title).toBe("Book the venue");
    expect(describeDue(task.due, "12h")).toBe("The day before");
  });
});

describe("guideToWorkflow", () => {
  it("orders the tasks by when they're due", () => {
    const fields = guideToWorkflow({
      name: " Match day ",
      description: "",
      tasks: [
        guideTask("Clips for socials"),
        { ...guideTask("Results post"), workGroupId: "social" },
        guideTask("Announcement post"),
        guideTask("Graphic"),
      ],
    });
    expect(fields.name).toBe("Match day");
    expect(fields.steps.map((step) => step.title)).toEqual([
      "Announcement post",
      "Graphic",
      "Results post",
      "Clips for socials",
    ]);
    expect(fields.steps[2].workGroupId).toBe("social");
    expect(fields.steps[2].posts).toBeNull();
  });
});

describe("giveTo", () => {
  it("is a group or a person, never both", () => {
    expect(giveToValue({ workGroupId: "design", memberId: "sam" })).toBe(
      "group:design",
    );
    expect(giveToValue({ workGroupId: null, memberId: "sam" })).toBe(
      "member:sam",
    );
    expect(giveToValue({ workGroupId: null, memberId: null })).toBe("");
    expect(parseGiveTo("group:design")).toEqual({
      workGroupId: "design",
      memberId: null,
    });
    expect(parseGiveTo("member:sam")).toEqual({
      workGroupId: null,
      memberId: "sam",
    });
    expect(parseGiveTo("")).toEqual({ workGroupId: null, memberId: null });
  });
});

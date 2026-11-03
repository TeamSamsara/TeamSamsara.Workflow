// File : /TeamSamsara.Workflow/app/src/features/workflows/model/workflowDraft.test.ts
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : Tests the editor's step changes.

import { describe, expect, it } from "vitest";
import { WorkflowLimits } from "../types/workflowTypes";
import {
  addStep,
  changeStep,
  duplicateStep,
  newStep,
  orderSteps,
  removeStep,
  tidyWorkflow,
} from "./workflowDraft";

const named = (title: string) => ({ ...newStep(), title });

describe("steps", () => {
  it("are added at the end, up to the limit", () => {
    const one = addStep([]);
    expect(one).toHaveLength(1);
    const full = Array.from({ length: WorkflowLimits.steps }, () => newStep());
    expect(addStep(full)).toHaveLength(WorkflowLimits.steps);
  });

  it("change one at a time", () => {
    const steps = [named("A"), named("B")];
    const changed = changeStep(steps, steps[1].id, { title: "Thumbnail" });
    expect(changed.map((step) => step.title)).toEqual(["A", "Thumbnail"]);
    expect(changed[0]).toBe(steps[0]);
  });

  it("duplicate right after the original with new ids", () => {
    const steps = [
      { ...named("A"), checklist: [{ id: "x", text: "Logo" }] },
      named("B"),
    ];
    const { steps: next, copyId } = duplicateStep(steps, steps[0].id);
    expect(next.map((step) => step.title)).toEqual(["A", "A", "B"]);
    expect(copyId).toBe(next[1].id);
    expect(next[1].id).not.toBe(steps[0].id);
    expect(next[1].checklist?.[0].id).not.toBe("x");
    expect(next[1].checklist?.[0].text).toBe("Logo");
  });

  it("are removed and reordered", () => {
    const steps = [named("A"), named("B"), named("C")];
    expect(removeStep(steps, steps[1].id).map((step) => step.title)).toEqual([
      "A",
      "C",
    ]);
    const ids = [steps[2].id, steps[0].id];
    expect(orderSteps(steps, ids).map((step) => step.title)).toEqual([
      "C",
      "A",
      "B",
    ]);
  });
});

describe("tidyWorkflow", () => {
  it("trims text and drops empty checklist items", () => {
    const tidy = tidyWorkflow({
      name: "  Livestream ",
      description: " Before and after ",
      eventTypeId: null,
      steps: [
        {
          ...named(" Thumbnail "),
          checklist: [
            { id: "a", text: " Logo " },
            { id: "b", text: "  " },
          ],
          links: [{ label: " Brief ", url: " https://example.com " }],
        },
      ],
    });
    expect(tidy.name).toBe("Livestream");
    expect(tidy.description).toBe("Before and after");
    expect(tidy.steps[0].title).toBe("Thumbnail");
    expect(tidy.steps[0].checklist).toEqual([{ id: "a", text: "Logo" }]);
    expect(tidy.steps[0].links).toEqual([
      { label: "Brief", url: "https://example.com" },
    ]);
  });
});

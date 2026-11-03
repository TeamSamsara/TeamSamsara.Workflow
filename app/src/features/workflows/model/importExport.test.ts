// File : /TeamSamsara.Workflow/app/src/features/workflows/model/importExport.test.ts
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : Tests that a workflow exports and imports back as a copy, and that
// imports drop what this workspace doesn't have.

import { describe, expect, it } from "vitest";
import type { WorkflowRecord } from "../types/workflowTypes";
import {
  exportFileName,
  exportWorkflow,
  importWorkflow,
  type ImportContext,
} from "./importExport";
import { newStep } from "./workflowDraft";

const workflow: WorkflowRecord = {
  id: "w1",
  name: "Livestream",
  description: "Before, during and after a stream.",
  eventTypeId: "stream",
  archived: false,
  createdAt: null,
  updatedAt: null,
  steps: [
    {
      ...newStep(),
      title: "Go-live post",
      workGroupId: "social",
      memberId: "alex",
      tagIds: ["sponsor"],
      due: { direction: "at", days: 0, hours: 0, minutes: 0, time: null },
      posts: [
        { platformId: "x", formatId: null, texts: { post: "Live! {link}" } },
      ],
      asksForLiveLink: true,
    },
    {
      ...newStep(),
      title: "Thumbnail",
      checklist: [{ id: "a", text: "Logo" }],
      links: [{ label: "Brief", url: "https://example.com/brief" }],
      needsApproval: true,
    },
  ],
};

const here: ImportContext = {
  workGroupIds: ["social"],
  memberIds: ["alex"],
  tagIds: ["sponsor"],
  eventTypeIds: ["stream"],
  platformIds: ["x"],
  workflowNames: [],
};

describe("export and import", () => {
  it("brings back the same workflow", () => {
    const result = importWorkflow(exportWorkflow(workflow), here);
    if (!result.ok) throw new Error(result.error);
    expect(result.dropped).toBe(0);
    expect(result.fields.name).toBe("Livestream");
    expect(result.fields.eventTypeId).toBe("stream");
    const strip = (steps: WorkflowRecord["steps"]) =>
      steps.map((step) => ({
        ...step,
        id: "",
        checklist: step.checklist?.map((item) => item.text) ?? null,
      }));
    expect(strip(result.fields.steps)).toEqual(strip(workflow.steps));
    expect(result.fields.steps[0].id).not.toBe(workflow.steps[0].id);
  });

  it("names it a copy when the name is taken", () => {
    const taken = {
      ...here,
      workflowNames: ["livestream", "Livestream (copy)"],
    };
    const result = importWorkflow(exportWorkflow(workflow), taken);
    expect(result.ok && result.fields.name).toBe("Livestream (copy 2)");
  });

  it("drops what this workspace doesn't have", () => {
    const elsewhere: ImportContext = {
      workGroupIds: [],
      memberIds: [],
      tagIds: [],
      eventTypeIds: [],
      platformIds: [],
      workflowNames: [],
    };
    const result = importWorkflow(exportWorkflow(workflow), elsewhere);
    if (!result.ok) throw new Error(result.error);
    // Group, person, tag and X post on the first task, and the event type.
    expect(result.dropped).toBe(5);
    expect(result.fields.steps[0].workGroupId).toBeNull();
    expect(result.fields.steps[0].posts).toEqual([]);
    expect(result.fields.eventTypeId).toBeNull();
  });

  it("refuses files that aren't workflows", () => {
    expect(importWorkflow("not json", here).ok).toBe(false);
    expect(importWorkflow('{"kind":"something"}', here).ok).toBe(false);
    expect(
      importWorkflow(
        '{"kind":"teamsamsara-workflow","version":9,"workflow":{}}',
        here,
      ).ok,
    ).toBe(false);
  });

  it("names the file after the workflow", () => {
    expect(exportFileName("Clips after stream!")).toBe(
      "clips-after-stream.workflow.json",
    );
    expect(exportFileName("???")).toBe("workflow.workflow.json");
  });
});

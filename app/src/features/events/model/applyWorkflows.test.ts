// File : /TeamSamsara.Workflow/app/src/features/events/model/applyWorkflows.test.ts
// Version : 1.0.0
// Latest commit: feature/calendar-events
// Author : Gerrah
// Purpose : Tests turning an event and its workflows into tasks: due times in
// Toronto, filled gaps (and unfilled ones left visible), the gaps to ask for.

import { describe, expect, it } from "vitest";
import { newStep, type WorkflowRecord } from "@/features/workflows";
import {
  applyWorkflows,
  askedGaps,
  gapLabel,
  gapValues,
} from "./applyWorkflows";

const formats = {
  timeZone: "America/Toronto",
  clock: "12h",
  dateFormat: "weekdayMonthDay",
} as const;

// Monday 9 November 2026, 7:00 PM in Toronto.
const match = {
  title: "vs. Team Nova",
  startsAt: new Date("2026-11-10T00:00:00Z"),
  link: "https://twitch.tv/samsara",
  details: { opponent: "Team Nova", sponsor: " " },
};

const workflow: WorkflowRecord = {
  id: "matchday",
  name: "Match day",
  description: "",
  eventTypeId: null,
  archived: false,
  createdAt: null,
  updatedAt: null,
  steps: [
    {
      ...newStep(),
      id: "announce",
      title: "Announce {title}",
      workGroupId: "social",
      due: {
        direction: "before",
        days: 1,
        hours: 0,
        minutes: 0,
        time: "12:00",
      },
      posts: [
        {
          platformId: "x",
          formatId: null,
          texts: {
            post: "{opponent} on {date} at {time}. Watch: {link} {sponsor}",
          },
        },
      ],
      checklist: [{ id: "c1", text: "Tag {opponent}" }],
    },
    {
      ...newStep(),
      id: "results",
      title: "Results post",
      due: { direction: "after", days: 0, hours: 3, minutes: 0, time: null },
      needsApproval: true,
    },
  ],
};

describe("applyWorkflows", () => {
  it("makes a task per step with its due time and filled gaps", () => {
    const tasks = applyWorkflows(match, [workflow], formats);
    expect(tasks.map((task) => task.title)).toEqual([
      "Announce vs. Team Nova",
      "Results post",
    ]);
    const [announce, results] = tasks;
    expect(announce.dueAt).toEqual(new Date("2026-11-08T17:00:00Z"));
    expect(results.dueAt).toEqual(new Date("2026-11-10T03:00:00Z"));
    expect(announce.posts?.[0].texts.post).toBe(
      "Team Nova on Mon, Nov 9 at 7:00 PM. Watch: https://twitch.tv/samsara {sponsor}",
    );
    expect(announce.checklist).toEqual([
      { id: "c1", text: "Tag Team Nova", done: false },
    ]);
    expect(announce).toMatchObject({
      workflowId: "matchday",
      stepId: "announce",
      workGroupId: "social",
    });
    expect(results.needsApproval).toBe(true);
  });

  it("leaves {link} visible when the event has none", () => {
    const values = gapValues({ ...match, link: null }, formats);
    expect(values.link).toBeUndefined();
    const [announce] = applyWorkflows(
      { ...match, link: null },
      [workflow],
      formats,
    );
    expect(announce.posts?.[0].texts.post).toContain("Watch: {link}");
  });
});

describe("askedGaps", () => {
  it("lists the gaps to ask for, not the event's own", () => {
    expect(askedGaps([workflow])).toEqual(["opponent", "sponsor"]);
    expect(gapLabel("co_streamer")).toBe("Co streamer");
  });
});

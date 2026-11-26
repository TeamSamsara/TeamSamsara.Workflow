// File : /TeamSamsara.Workflow/engine/src/sync.test.ts
// Version : 1.1.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Tests keeping a task in line with its step: untouched parts
// follow, parts changed by hand stay (recorded, or worked out for older
// tasks), gaps are always filled, finished tasks and passed due times aren't
// touched.

// describe, it and expect come from Vitest's globals (see app/vitest.config.ts):
// the engine has no packages of its own to import them from.
import { planTaskSync, type TaskForSync } from "./sync.js";
import {
  applyWorkflows,
  type StepForTasks,
  type WorkflowForTasks,
} from "./tasks.js";

const formats = {
  timeZone: "America/Toronto",
  clock: "12h",
  dateFormat: "weekdayMonthDay",
} as const;

// Thu Nov 12, 2026 at 8:00 PM in Toronto.
const event = {
  title: "vs. Orca",
  startsAt: new Date("2026-11-13T01:00:00Z"),
  link: null,
  details: { opponent: "Orca" },
};
const now = new Date("2026-11-11T19:00:00Z");

const base: StepForTasks = {
  id: "caption",
  title: "Prep caption vs {opponent}",
  notes: "",
  workGroupId: null,
  memberId: null,
  due: { direction: "before", days: 1, hours: 0, minutes: 0, time: null },
  needsApproval: false,
  tagIds: [],
  posts: null,
  checklist: [{ id: "c1", text: "Draft" }],
  links: null,
  asksForLiveLink: false,
};

const workflow = (step: StepForTasks): WorkflowForTasks => ({
  id: "promo",
  steps: [step],
});
const made = (step: StepForTasks) =>
  applyWorkflows(event, [workflow(step)], formats)[0];

function taskFrom(
  step: StepForTasks,
  extra: Partial<TaskForSync> = {},
): TaskForSync {
  const planned = made(step);
  return {
    id: "t1",
    title: planned.title,
    notes: planned.notes,
    workGroupId: planned.workGroupId,
    memberId: planned.memberId,
    dueAt: planned.dueAt,
    checklist: planned.checklist,
    posts: planned.posts,
    doneAt: null,
    editedParts: [],
    ...extra,
  };
}

const now1hBefore: StepForTasks = {
  ...base,
  workGroupId: "marketing",
  due: { direction: "before", days: 0, hours: 1, minutes: 0, time: null },
  posts: [
    { platformId: "x", formatId: null, texts: { post: "We face {opponent}" } },
  ],
};

describe("planTaskSync", () => {
  it("brings an untouched task fully in line", () => {
    const sync = planTaskSync(
      taskFrom(base),
      made(now1hBefore),
      made(base),
      { now },
    );
    expect(sync?.parts).toEqual(["due", "assignee", "posts"]);
    expect(sync?.changes.workGroupId).toBe("marketing");
    expect(sync?.changes.dueAt?.toISOString()).toBe(
      "2026-11-13T00:00:00.000Z",
    );
    expect(sync?.changes.posts?.[0].texts.post).toBe("We face Orca");
  });

  it("keeps parts recorded as changed by hand", () => {
    const sync = planTaskSync(
      taskFrom(base, {
        workGroupId: "video",
        editedParts: ["assignee", "due"],
      }),
      made(now1hBefore),
      made(base),
      { now },
    );
    expect(sync?.parts).toEqual(["posts"]);
    expect(sync?.held.map((entry) => entry.part)).toEqual(["due", "assignee"]);
  });

  it("works out hand edits on older tasks from the previous version", () => {
    const older = taskFrom(base, {
      editedParts: null,
      title: "My own caption",
      dueAt: new Date("2026-11-12T18:00:00Z"),
    });
    const sync = planTaskSync(older, made(now1hBefore), made(base), { now });
    expect(sync?.parts).toEqual(["assignee", "posts"]);
    expect(sync?.held.map((entry) => entry.part)).toEqual(["due"]);
  });

  it("with no previous version, fills only gaps on a touched task", () => {
    const touched = taskFrom(base, { editedParts: null, touched: true });
    const sync = planTaskSync(touched, made(now1hBefore), null, { now });
    // No one given it and no post text: both filled; the due time stays.
    expect(sync?.parts).toEqual(["assignee", "posts"]);
    expect(sync?.held.map((entry) => entry.part)).toEqual(["due"]);
    const fresh = taskFrom(base, { editedParts: null, touched: false });
    expect(planTaskSync(fresh, made(now1hBefore), null, { now })?.parts).toEqual(
      ["due", "assignee", "posts"],
    );
  });

  it("keeps whoever in the step's group took the task", () => {
    const inGroup = { ...now1hBefore, posts: null };
    const taken = taskFrom(inGroup, { memberId: "sam", editedParts: [] });
    expect(planTaskSync(taken, made(inGroup), null, { now })).toBeNull();
    // A step moved to another group takes the task with it, without them.
    const moved = planTaskSync(
      taken,
      made({ ...inGroup, workGroupId: "video" }),
      made(inGroup),
      { now },
    );
    expect(moved?.changes).toMatchObject({ workGroupId: "video", memberId: null });
  });

  it("keeps ticks and hand-added items, adds the step's new ones", () => {
    const next = {
      ...base,
      checklist: [
        { id: "c1", text: "Draft" },
        { id: "c2", text: "Tag {opponent}" },
      ],
    };
    const task = taskFrom(base, {
      checklist: [
        { id: "c1", text: "Draft", done: true },
        { id: "mine", text: "Extra", done: false },
      ],
    });
    const sync = planTaskSync(task, made(next), made(base), { now });
    expect(sync?.changes.checklist).toEqual([
      { id: "c1", text: "Draft", done: true },
      { id: "c2", text: "Tag Orca", done: false },
      { id: "mine", text: "Extra", done: false },
    ]);
  });

  it("leaves finished tasks and doesn't move a due time into the past", () => {
    expect(
      planTaskSync(
        taskFrom(base, { doneAt: now }),
        made(now1hBefore),
        made(base),
        { now },
      ),
    ).toBeNull();
    const twoDays = {
      ...base,
      due: { direction: "before", days: 2, hours: 0, minutes: 0, time: null },
    } as const;
    const sync = planTaskSync(taskFrom(base), made(twoDays), made(base), {
      now,
    });
    expect(sync?.held).toEqual([{ part: "due", reason: "late" }]);
    expect(sync?.parts).toEqual([]);
  });
});

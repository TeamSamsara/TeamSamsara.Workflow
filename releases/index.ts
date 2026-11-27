// File : /TeamSamsara.Workflow/releases/index.ts
// Version : 1.1.0
// Latest commit: feature/1.2-docs-seed
// Author : Gerrah
// Purpose : Every release of Playbook, newest first, as people read about it
// in What's new. The notes are written together before each release (see
// README.md). 1.2.0 is from the approved patch notes.

import type { Release } from "./types.js";

export type { ChangeKind, Release, ReleaseChange } from "./types.js";
export { ChangeKinds } from "./types.js";
export {
  compareVersions,
  highlightsOf,
  latestRelease,
  releaseForViewer,
  unseenRelease,
} from "./model.js";

export const releases: readonly Release[] = [
  {
    version: "1.2.0",
    date: "2026-11-27",
    summary:
      "Tasks can now depend on other tasks, weekly capacity is taken into account when assigning work, and administrators have more control over how they manage their workspace.",
    changes: [
      {
        kind: "new",
        title: "Workload Management",
        body: "Your team's capacity now matters. Every person, group, and workspace can have a defined weekly capacity. When assigning tasks, Playbook prioritizes people with the most available room. Four workload statuses show how full a week is: Available, Limited, At capacity and Over capacity.",
        highlight: true,
        article: "your-week",
        picture: "yourWeek",
      },
      {
        kind: "new",
        title: "Task Dependencies",
        body: "Some tasks need to wait their turn. Tasks waiting on another task appear under Waiting on others in My Tasks. Once the required task is completed or approved, the dependent task automatically unlocks and the assigned person receives a notification. Need to get something done anyway? You can override the dependency and provide a reason.",
        highlight: true,
        article: "waiting-on-others",
        picture: "waitingTask",
      },
      {
        kind: "new",
        title: "Workflow Sequencing",
        body: "Build workflows that follow the way your team actually works. A step can wait until the previous step is completed or approved, or only follow it without waiting. You can also configure what happens when a previous step becomes overdue.",
        highlight: true,
        article: "step-order",
        picture: "orderRules",
      },
      {
        kind: "new",
        title: "View as a Role",
        body: "See Playbook from someone else's perspective. Available through Settings → Roles. A persistent indicator appears while viewing another role, so you can return to your own view at any time.",
        highlight: true,
        audience: "admins",
        article: "view-as-role",
        picture: "viewingAs",
      },
      {
        kind: "new",
        title: "Task Priority",
        body: "Tasks can now be assigned a priority: High, Normal, or Low. When multiple tasks share the same due date, higher-priority tasks appear first.",
        article: "step-order",
      },
      {
        kind: "new",
        title: "Weekly Capacity",
        body: "Owners and Administrators can now define a usual working capacity for the entire workspace, individual groups, and individual members. When distributing tasks, Playbook prioritizes members with the most room available that week.",
        audience: "admins",
        article: "workload",
      },
      {
        kind: "new",
        title: "Capacity Overrides",
        body: "Administrators can still assign tasks to members who have already reached their weekly capacity. Playbook requires a reason, records the override in the Activity feed, and notifies the assigned member.",
        audience: "admins",
        article: "workload",
      },
      {
        kind: "new",
        title: "Intended Assignees",
        body: "When a workflow assigns a task to someone who has no remaining capacity, the task can wait in their group instead, marked as intended for that person. Group leads can assign it once capacity becomes available.",
        article: "workload",
      },
      {
        kind: "new",
        title: "Workload Warnings",
        body: "Creating an event that would push a group beyond its weekly capacity now triggers a warning first, also when planning several events at once, for every date of a repeating event, and when previewing a workflow on a date. You can still proceed. Group pages also show the upcoming four weeks.",
        article: "workload",
      },
      {
        kind: "new",
        title: "Calendar Pages",
        body: "The new Calendars page gives an overview of every calendar in your workspace, with each one's activity this week and its next event. Individual calendar pages can be shared through direct links.",
        article: "calendar",
      },
      {
        kind: "new",
        title: "Team Availability",
        body: "The new Team Availability page brings all workspace groups together in one place. Each group has its own page for its availability and weekly capacity.",
        article: "team-week",
      },
      {
        kind: "new",
        title: "Flow View",
        body: "Workflows and events can now be shown as a flow, in time order, with the event's start marked and lines showing what has to happen first. In the workflow editor, link two steps by dragging from one onto the other, and click a link to change or remove it.",
        article: "flow-view",
      },
      {
        kind: "new",
        title: "Preview on a Date",
        body: "Pick a date and time in the workflow editor to see the tasks the workflow would create for an event then: when each is due, who gets it, and how full their week already is. Late tasks and groups going over capacity are flagged. Nothing is created.",
        article: "preview-on-a-date",
      },
      {
        kind: "improved",
        title: "Workflow Step Editor",
        body: "The step editor has been completely redesigned into six sections: What, Who, When, Order, Priority and Approval, and Extras. Each explains what the step does, and built-in checks point out configuration issues and how to resolve them.",
        article: "step-order",
      },
      {
        kind: "improved",
        title: "Saving Workflows",
        body: "Saving a workflow never moves anyone's tasks. After you save, Playbook lists the upcoming tasks whose due time no longer matches their step, so you can move them one at a time, move them all, or leave them. People whose tasks are moved are notified.",
        article: "workflow-changes",
      },
      {
        kind: "improved",
        title: "Task Assignment",
        body: "Task assignment no longer relies on a daily limit. Playbook distributes work based on weekly capacity, prioritizing members with the most available room.",
        article: "workload",
      },
      {
        kind: "improved",
        title: "Notifications",
        body: "Members are now notified when a task they wait on is done and theirs becomes available, when their weekly capacity becomes available again, and when they receive a task beyond their capacity. Group leads are notified when a task is waiting for its intended assignee.",
        article: "notifications",
      },
      {
        kind: "improved",
        title: "Permissions",
        body: "The Plan Events permission has been renamed to Create Events, in role settings and the Help Center.",
        article: "roles",
      },
      {
        kind: "improved",
        title: "Help Center",
        body: "New documentation and illustrations cover the features and changes in Playbook 1.2.",
      },
      {
        kind: "fixed",
        title: "Events and Workflows",
        body: "Fixed an issue where saving changes to a workflow could add tasks to events that had already started.",
        article: "workflow-changes",
      },
    ],
  },
];

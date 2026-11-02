// File : /TeamSamsara.Workflow/app/src/features/onboarding/model/chapters.ts
// Version : 1.0.0
// Latest commit: feature/onboarding
// Author : Gerrah
// Purpose : The walkthrough's chapters, each for one thing a person can do,
// shown only to people with its permission. A chapter is a few steps; each
// step opens a page and lights up one part of it (a TourTarget) with a short
// note. The last chapter, "Make it yours", is a dialog rather than steps.

import type { PermissionKey } from "@/core/access";
import { RoutePaths } from "@/shared/constants/routePaths";
import { ChapterText as Text } from "../ui/onboardingContent";

/** The parts of pages the walkthrough points at (see TourTarget). */
export type TourTargetId =
  | "nav"
  | "calendarPicker"
  | "calendarViews"
  | "calendarBody"
  | "newMenu"
  | "myTasks"
  | "myTasksSide"
  | "availabilityPainter"
  | "availabilityExceptions"
  | "eventPeople"
  | "eventWorkflows"
  | "eventRepeat"
  | "planShared"
  | "planRows"
  | "setsList"
  | "teamGrid"
  | "teamBest"
  | "workflowsNew"
  | "workflowsList"
  | "settingsMenu"
  | "membersInvite";

export interface TourStep {
  path: string;
  target: TourTargetId;
  title: string;
  body: string;
  /** Asks them to try it on the page (nothing is saved by trying). */
  tryIt?: boolean;
  /** Shown only to people with one of these, inside a chapter for more people. */
  requires?: readonly PermissionKey[];
}

export const ChapterIds = [
  "gettingAround",
  "myTasks",
  "yourTime",
  "planning",
  "several",
  "teamAvailability",
  "workflows",
  "approving",
  "settings",
  "yours",
] as const;
export type ChapterId = (typeof ChapterIds)[number];

export interface Chapter {
  id: ChapterId;
  title: string;
  /** Roughly how long it takes, in minutes. */
  minutes: number;
  /** Shown to people with one of these; null is everyone. */
  requires: readonly PermissionKey[] | null;
  steps: readonly TourStep[];
}

const S = Text.steps;

export const Chapters: readonly Chapter[] = [
  {
    id: "gettingAround",
    title: Text.titles.gettingAround,
    minutes: 2,
    requires: null,
    steps: [
      { path: RoutePaths.calendar, target: "nav", ...S.nav },
      { path: RoutePaths.calendar, target: "calendarPicker", ...S.picker },
      { path: RoutePaths.calendar, target: "calendarViews", ...S.views },
      { path: RoutePaths.calendar, target: "calendarBody", ...S.events },
    ],
  },
  {
    id: "myTasks",
    title: Text.titles.myTasks,
    minutes: 2,
    requires: ["doAssignedTasks"],
    steps: [
      { path: RoutePaths.myTasks, target: "myTasks", ...S.tasks },
      { path: RoutePaths.myTasks, target: "myTasks", ...S.review },
    ],
  },
  {
    id: "yourTime",
    title: Text.titles.yourTime,
    minutes: 2,
    requires: null,
    steps: [
      {
        path: RoutePaths.availability,
        target: "availabilityPainter",
        tryIt: true,
        ...S.paint,
      },
      {
        path: RoutePaths.availability,
        target: "availabilityExceptions",
        ...S.exceptions,
      },
      { path: RoutePaths.calendar, target: "newMenu", ...S.personal },
    ],
  },
  {
    id: "planning",
    title: Text.titles.planning,
    minutes: 3,
    requires: ["planEvents"],
    steps: [
      { path: RoutePaths.calendar, target: "newMenu", ...S.newEvent },
      { path: RoutePaths.newEvent, target: "eventPeople", ...S.people },
      { path: RoutePaths.newEvent, target: "eventWorkflows", ...S.workflows },
      { path: RoutePaths.newEvent, target: "eventRepeat", ...S.repeat },
    ],
  },
  {
    id: "several",
    title: Text.titles.several,
    minutes: 2,
    requires: ["planEvents"],
    steps: [
      { path: RoutePaths.planSeveral, target: "planShared", ...S.shared },
      { path: RoutePaths.planSeveral, target: "planRows", ...S.rows },
      { path: RoutePaths.eventSets, target: "setsList", ...S.sets },
    ],
  },
  {
    id: "teamAvailability",
    title: Text.titles.teamAvailability,
    minutes: 1,
    requires: ["viewAvailability"],
    steps: [
      { path: RoutePaths.availabilityTeam, target: "teamGrid", ...S.team },
      { path: RoutePaths.availabilityTeam, target: "teamBest", ...S.best },
    ],
  },
  {
    id: "workflows",
    title: Text.titles.workflows,
    minutes: 2,
    requires: ["editWorkflows"],
    steps: [
      { path: RoutePaths.workflows, target: "workflowsList", ...S.whatIs },
      { path: RoutePaths.workflows, target: "workflowsNew", ...S.make },
    ],
  },
  {
    id: "approving",
    title: Text.titles.approving,
    minutes: 1,
    requires: ["approveTasks"],
    steps: [
      { path: RoutePaths.myTasks, target: "myTasksSide", ...S.approvals },
    ],
  },
  {
    id: "settings",
    title: Text.titles.settings,
    minutes: 2,
    requires: [
      "administrator",
      "manageSettings",
      "manageMembers",
      "manageRoles",
      "manageWorkGroups",
    ],
    steps: [
      { path: RoutePaths.settings, target: "settingsMenu", ...S.settings },
      {
        path: RoutePaths.settingsMembers,
        target: "membersInvite",
        requires: ["manageMembers"],
        ...S.invite,
      },
    ],
  },
  {
    id: "yours",
    title: Text.titles.yours,
    minutes: 1,
    requires: null,
    steps: [],
  },
];

const allows = (
  requires: readonly PermissionKey[] | null | undefined,
  permissions: ReadonlySet<PermissionKey>,
) => !requires || requires.some((key) => permissions.has(key));

/** The chapters for someone with these permissions, with only their steps. */
export function chaptersFor(
  permissions: ReadonlySet<PermissionKey>,
): Chapter[] {
  return Chapters.filter((chapter) =>
    allows(chapter.requires, permissions),
  ).map((chapter) => ({
    ...chapter,
    steps: chapter.steps.filter((step) => allows(step.requires, permissions)),
  }));
}

/** Their chapters not done yet, in order. */
export function chaptersLeft(
  permissions: ReadonlySet<PermissionKey>,
  done: readonly string[],
): Chapter[] {
  return chaptersFor(permissions).filter(
    (chapter) => !done.includes(chapter.id),
  );
}

export function totalMinutes(chapters: readonly Chapter[]): number {
  return chapters.reduce((sum, chapter) => sum + chapter.minutes, 0);
}

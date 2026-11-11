// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/pictures/index.ts
// Version : 1.0.0
// Latest commit: feature/docs-refresh
// Author : Gerrah
// Purpose : Every picture the help can show, by the name an article uses.

import type { ComponentType } from "react";
import {
  FillClick,
  FillDone,
  FillType,
  SetPage,
  TaskAfterFill,
  TaskBeforeFill,
} from "./setPictures";
import { MyTasksPage, TaskOrder } from "./taskPictures";
import {
  EventsFollow,
  HandEditAfter,
  HandEditBefore,
  Notified,
  StepChanged,
  UpdateFromWorkflows,
} from "./workflowPictures";

export const docPictures = {
  setPage: SetPage,
  fillClick: FillClick,
  fillType: FillType,
  fillDone: FillDone,
  taskBeforeFill: TaskBeforeFill,
  taskAfterFill: TaskAfterFill,
  myTasksPage: MyTasksPage,
  taskOrder: TaskOrder,
  stepChanged: StepChanged,
  eventsFollow: EventsFollow,
  notified: Notified,
  handEditBefore: HandEditBefore,
  handEditAfter: HandEditAfter,
  updateFromWorkflows: UpdateFromWorkflows,
} satisfies Record<string, ComponentType>;

export type PictureName = keyof typeof docPictures;

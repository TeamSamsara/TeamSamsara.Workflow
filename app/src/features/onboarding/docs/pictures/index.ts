// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/pictures/index.ts
// Version : 1.0.2
// Latest commit: feature/audit-fixes
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
import {
  AskReplyCounts,
  AskReplyNotice,
  AskReplyOn,
  DeleteRepeat,
  LateWarning,
  NewEventForm,
  RepeatPicker,
  SeveralMade,
  SeveralRows,
  SeveralShared,
  WhoCanMake,
} from "./planningPictures";
import {
  Exception,
  GroupPage,
  PersonalOthers,
  PersonalYours,
  Profile,
  TagsOnPerson,
  TagsSettings,
  TeamAvailability,
  UsualWeek,
} from "./peoplePictures";
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
  newEventForm: NewEventForm,
  lateWarning: LateWarning,
  whoCanMake: WhoCanMake,
  askReplyOn: AskReplyOn,
  askReplyNotice: AskReplyNotice,
  askReplyCounts: AskReplyCounts,
  repeatPicker: RepeatPicker,
  deleteRepeat: DeleteRepeat,
  severalShared: SeveralShared,
  severalRows: SeveralRows,
  severalMade: SeveralMade,
  usualWeek: UsualWeek,
  exception: Exception,
  personalYours: PersonalYours,
  personalOthers: PersonalOthers,
  teamAvailability: TeamAvailability,
  tagsSettings: TagsSettings,
  tagsOnPerson: TagsOnPerson,
  groupPage: GroupPage,
  profile: Profile,
} satisfies Record<string, ComponentType>;

export type PictureName = keyof typeof docPictures;

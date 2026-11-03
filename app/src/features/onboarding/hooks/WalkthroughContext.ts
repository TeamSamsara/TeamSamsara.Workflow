// File : /TeamSamsara.Workflow/app/src/features/onboarding/hooks/WalkthroughContext.ts
// Version : 1.0.0
// Latest commit: feature/onboarding
// Author : Gerrah
// Purpose : What pages can do with the walkthrough: start it (from the next
// chapter left, or given chapters), replay it all, hide its card, and know
// which chapters a person has and has left.

import { createContext } from "react";
import type { Walkthrough } from "@/core/data";
import type { Chapter, ChapterId } from "../model/chapters";

export interface WalkthroughApi {
  /** This person's chapters, for what they can do. */
  chapters: Chapter[];
  /** Those not done yet. */
  left: Chapter[];
  /** What's saved; null until they first see it. */
  record: Walkthrough | null;
  isRunning: boolean;
  /** Runs these chapters, or the ones left. */
  start: (chapterIds?: readonly ChapterId[]) => void;
  /** Runs every chapter again. */
  replay: () => void;
  hide: () => void;
}

export const WalkthroughContext = createContext<WalkthroughApi | null>(null);

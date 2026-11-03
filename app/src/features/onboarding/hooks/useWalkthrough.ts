// File : /TeamSamsara.Workflow/app/src/features/onboarding/hooks/useWalkthrough.ts
// Version : 1.0.0
// Latest commit: feature/onboarding
// Author : Gerrah
// Purpose : The walkthrough, from inside the signed-in app.

import { useContext } from "react";
import { WalkthroughContext, type WalkthroughApi } from "./WalkthroughContext";

const outside: WalkthroughApi = {
  chapters: [],
  left: [],
  record: null,
  isRunning: false,
  start: () => undefined,
  replay: () => undefined,
  hide: () => undefined,
};

export function useWalkthrough(): WalkthroughApi {
  return useContext(WalkthroughContext) ?? outside;
}

// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/pictures/activeCallout.ts
// Version : 1.0.0
// Latest commit: feature/docs-refresh
// Author : Gerrah
// Purpose : The callout picked beside a picture, so its mark and spot light up.

import { createContext } from "react";

export const ActiveCallout = createContext<number | null>(null);

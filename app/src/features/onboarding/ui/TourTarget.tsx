// File : /TeamSamsara.Workflow/app/src/features/onboarding/ui/TourTarget.tsx
// Version : 1.0.0
// Latest commit: feature/onboarding
// Author : Gerrah
// Purpose : Marks a part of a page the walkthrough can point at. It adds no
// box of its own (display: contents), so wrapping something never changes
// how the page looks; the walkthrough lights up what's inside it.

import type { ReactNode } from "react";
import type { TourTargetId } from "../model/chapters";

export const tourAttribute = "data-tour";

export function TourTarget({
  id,
  children,
}: {
  id: TourTargetId;
  children: ReactNode;
}) {
  return (
    <div {...{ [tourAttribute]: id }} style={{ display: "contents" }}>
      {children}
    </div>
  );
}

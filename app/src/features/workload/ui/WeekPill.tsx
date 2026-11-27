// File : /TeamSamsara.Workflow/app/src/features/workload/ui/WeekPill.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-workload
// Author : Gerrah
// Purpose : A week in one word, as a pill: Available, Limited, At capacity or
// Over capacity, each in its own tone.

import type { WeekState } from "@engine/workload";
import { Pill, type PillTone } from "@/shared/components/Pill/Pill";
import { WeekStateText } from "./workloadContent";

const tones: Record<WeekState, PillTone> = {
  available: "success",
  limited: "info",
  atCapacity: "alert",
  over: "error",
};

export function WeekPill({ state }: { state: WeekState }) {
  return <Pill tone={tones[state]}>{WeekStateText[state].label}</Pill>;
}

// File : /TeamSamsara.Workflow/app/src/features/availability/ui/ZoneSwitch.tsx
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The "Show times in" switch on Team availability: the team's time
// zone or the viewer's own.

import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import { zoneCity } from "@/shared/time/timeZones";
import type { ZoneChoice } from "../model/viewZone";
import { TeamViewText as Text } from "./teamViewContent";

interface ZoneSwitchProps {
  value: ZoneChoice;
  onChange: (value: ZoneChoice) => void;
  teamZone: string;
  ownZone: string;
}

export function ZoneSwitch({
  value,
  onChange,
  teamZone,
  ownZone,
}: ZoneSwitchProps) {
  return (
    <SegmentedControl
      label={Text.showTimesIn}
      options={[
        { value: "team", label: Text.zones.team(zoneCity(teamZone)) },
        { value: "mine", label: Text.zones.mine(zoneCity(ownZone)) },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}

// File : /TeamSamsara.Workflow/app/src/features/availability/model/viewZone.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Which time zone Team availability shows: the team's (the
// workspace's) or the viewer's own, and how far apart they are ("3 h behind
// Toronto"), so labels and cells move together when it's switched.

export type ZoneChoice = "team" | "mine";

/** The zone to show times in. */
export function zoneFor(
  choice: ZoneChoice,
  teamZone: string,
  ownZone: string | null,
): string {
  return choice === "mine" && ownZone ? ownZone : teamZone;
}

/** Minutes a zone is ahead of UTC at a moment. */
function offsetMinutes(timeZone: string, at: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(at)
      .map((part) => [part.type, part.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
  );
  return Math.round((asUtc - at.getTime()) / 60_000);
}

/** How many hours `zone` is ahead of `other` (negative when behind). */
export function hoursApart(zone: string, other: string, at: Date): number {
  return (offsetMinutes(zone, at) - offsetMinutes(other, at)) / 60;
}

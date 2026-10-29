// File : /TeamSamsara.Workflow/app/src/shared/time/timeZones.ts
// Version : 1.0.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : The time zones a person can pick, with readable labels such as
// "America/Toronto (UTC−5)", sorted by their offset from UTC, plus the device's
// own zone and its usual time format to start setup from.

import type { SelectOption } from "@/shared/components/Fields/Select/Select";

/** Used when the browser can't say where it is. */
export const universalTimeZone = "UTC";

const minutesPerHour = 60;
const minusSign = "−";

/** Every IANA zone the browser knows, always including UTC. */
export function availableTimeZones(): string[] {
  const zones = Intl.supportedValuesOf("timeZone");
  return zones.includes(universalTimeZone)
    ? zones
    : [universalTimeZone, ...zones];
}

/** Whether the browser recognises this zone name. */
export function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** The zone the device is set to, or UTC when it can't be read. */
export function deviceTimeZone(): string {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return zone && isTimeZone(zone) ? zone : universalTimeZone;
}

/** Whether the device shows times on a 24-hour clock. */
export function deviceUses24HourClock(): boolean {
  const hourCycle = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
  }).resolvedOptions().hourCycle;
  return hourCycle === "h23" || hourCycle === "h24";
}

/** Minutes ahead of UTC (negative when behind) for a zone at a moment. */
export function utcOffsetMinutes(timeZone: string, at: Date): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  })
    .formatToParts(at)
    .find((part) => part.type === "timeZoneName")?.value;
  // "GMT-05:00", "GMT+05:30", or just "GMT" for UTC itself.
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name ?? "");
  if (!match) return 0;
  const [, sign, hours, minutes] = match;
  const total = Number(hours) * minutesPerHour + Number(minutes);
  return sign === "-" ? -total : total;
}

/** "UTC", "UTC+1", "UTC−5", "UTC+5:30". */
export function formatUtcOffset(offsetMinutes: number): string {
  if (offsetMinutes === 0) return universalTimeZone;
  const sign = offsetMinutes < 0 ? minusSign : "+";
  const absolute = Math.abs(offsetMinutes);
  const hours = Math.floor(absolute / minutesPerHour);
  const minutes = absolute % minutesPerHour;
  const rest = minutes ? `:${String(minutes).padStart(2, "0")}` : "";
  return `${universalTimeZone}${sign}${hours}${rest}`;
}

/** "America/Toronto (UTC−5)"; underscores in zone names read as spaces. */
export function timeZoneLabel(timeZone: string, at: Date): string {
  const name = timeZone.replaceAll("_", " ");
  return `${name} (${formatUtcOffset(utcOffsetMinutes(timeZone, at))})`;
}

/**
 * Options for a time zone Select, west to east, then by name. Offsets are worked
 * out for `at` (now by default), so daylight saving shows as it is today.
 */
export function timeZoneOptions(at: Date = new Date()): SelectOption[] {
  return availableTimeZones()
    .map((zone) => ({ zone, offset: utcOffsetMinutes(zone, at) }))
    .sort((a, b) => a.offset - b.offset || a.zone.localeCompare(b.zone))
    .map(({ zone }) => ({ value: zone, label: timeZoneLabel(zone, at) }));
}

// File : /TeamSamsara.Workflow/app/src/views/account/accountViewContent.ts
// Version : 1.4.0
// Latest commit: fix/modal-and-account-notifications
// Author : Gerrah
// Purpose : The words on Your account.

import type { TimeFormat } from "@/core/data";
import type { ThemeChoice } from "@/core/theme";

export const AccountViewText = {
  title: "Your account",
  description:
    "How you show up to others, and how Playbook shows things to you.",
  signOut: "Sign out",
  noRoles: "No roles or work groups yet",
  failed: "Couldn't save",
  saved: "Your account is saved",
  you: "You",
  name: "Name",
  nameRequired: "Enter your name.",
  gameName: "In-game name",
  optional: "Optional",
  gameNameHelp:
    "Shown first wherever you appear, with your name under it. Leave it empty to show just your name.",
  email: "Email",
  emailHint: "An admin changes this in Settings › Members.",
  time: "Time and dates",
  timeIntro: (city: string) =>
    `How you see times and dates. Events and tasks are still planned in ${city} time, the workspace's.`,
  timeZone: "Your time zone",
  sameAsWorkspace: (example: string) => `Same as the workspace (${example})`,
  nowSame: (time: string) => `It's ${time} now.`,
  nowBoth: (mine: string, workspace: string, city: string) =>
    `It's ${mine} for you, ${workspace} in ${city}.`,
  deviceZone: (city: string) => `Use ${city}, this device's`,
  dateFormat: "Dates",
  clock: "Clock",
  clocks: {
    "12h": "7:00 PM",
    "24h": "19:00",
  } satisfies Record<TimeFormat, string>,
  availabilityFollows:
    "Your usual week is in your own time zone, so its hours will count as hours in the new one.",
  theme: "Theme",
  themes: {
    light: "Light",
    dark: "Dark",
    device: "Same as device",
  } satisfies Record<ThemeChoice, string>,
  themeNote: "The theme changes right away, on this device.",
  reset: "Undo changes",
  save: "Save changes",
  notifications: "Notifications",
  notificationsHelp:
    "What Playbook tells you about, and where. Nothing you do yourself notifies you.",
  devices: "Your devices",
  devicesHelp:
    "Lost a phone or signed in on a shared computer? Sign out everywhere: other devices are signed out within the hour, this one right away.",
  signOutEverywhere: "Sign out everywhere",
  everywhereFailed: "Couldn't sign out everywhere. Try again.",
  help: "Help",
  helpProgress: (done: number, total: number) =>
    done >= total
      ? "You've been through the whole walkthrough. Replay it, or open one part from Documentation."
      : `Walkthrough: ${done} of ${total} chapters done. Pick it up from your calendar, or replay it all.`,
  replay: "Replay the walkthrough",
  openDocs: "Open Documentation",
  password: "Password",
  passwordChanged: "Password changed",
} as const;

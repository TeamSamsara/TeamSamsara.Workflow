// File : /TeamSamsara.Workflow/app/src/features/platforms/ui/platformsContent.ts
// Version : 1.1.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : The words for platform limits and the platforms table.

import type { PlatformTextField } from "../catalogue/platformTypes";

const numberFormat = new Intl.NumberFormat("en-US");

export const PlatformFieldText: Record<PlatformTextField, string> = {
  post: "Post",
  caption: "Caption",
  title: "Title",
  description: "Description",
  streamTitle: "Stream title",
  article: "Article",
};

export const PlatformLimitText = {
  characters: (field: string, max: number) =>
    `${field} ${numberFormat.format(max)} characters`,
  images: (count: number) =>
    count === 1 ? "1 image" : `up to ${count} images`,
  videos: (count: number) =>
    count === 1 ? "1 video" : `up to ${count} videos`,
  hashtags: (count: number) => `${count} hashtags`,
  separator: " · ",
  plural: (name: string) => `${name}s`,
} as const;

export const PlatformsTableText = {
  caption: "Platforms",
  platform: "Platform",
  limits: "Limits we check",
  status: "Status",
  use: "Use",
  on: "On",
  off: "Off",
  switchLabel: (name: string) => `Use ${name}`,
  turnedOn: (name: string) => `${name} switched on`,
  turnedOff: (name: string) => `${name} switched off`,
  failed: "That didn't save",
  hasUpgrade: (tier: string) => `Our account has ${tier}`,
  upgradeOn: (tier: string) => `Using ${tier} limits`,
  upgradeOff: (tier: string) => `Back to the free limits (no ${tier})`,
} as const;

// File : /TeamSamsara.Workflow/app/src/features/platforms/ui/platformsContent.ts
// Version : 1.1.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : The words for platform limits, the platforms table and paid tiers.

import type { PlatformTextField } from "../catalogue/platformTypes";

const numberFormat = new Intl.NumberFormat("en-US");

export const PlatformFieldText: Record<PlatformTextField, string> = {
  post: "Post",
  caption: "Caption",
  title: "Title",
  description: "Description",
  streamTitle: "Stream title",
  articleBody: "Articles",
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
  premiumLabel: (tier: string) => `Has ${tier}`,
  premiumOn: (tier: string) => `${tier} switched on`,
  premiumOff: (tier: string) => `${tier} switched off`,
} as const;

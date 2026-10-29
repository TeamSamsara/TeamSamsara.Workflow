// File : /TeamSamsara.Workflow/app/src/features/platforms/catalogue/platformCatalogue.ts
// Version : 1.0.0
// Latest commit: feature/workspace-settings
// Author : Gerrah
// Purpose : The platforms Workflow knows, with their current limits. This list
// comes with the app (it isn't edited per workspace); each workspace only
// chooses which ones it uses. Limits checked October 2026 — update them here
// when a platform changes its rules.

import type { Platform } from "./platformTypes";

export const PlatformCatalogue: readonly Platform[] = [
  {
    id: "x",
    name: "X",
    icon: "x",
    color: "#000000",
    texts: [{ field: "post", maxCharacters: 280 }],
    media: { maxImages: 4, maxVideos: 1 },
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "instagram",
    color: "#E1306C",
    texts: [{ field: "caption", maxCharacters: 2200 }],
    media: { maxImages: 20, maxHashtags: 30 },
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: "youtube",
    color: "#FF0000",
    texts: [
      { field: "title", maxCharacters: 100 },
      { field: "description", maxCharacters: 5000 },
    ],
    media: { maxVideos: 1 },
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: "tiktok",
    color: "#010101",
    texts: [{ field: "caption", maxCharacters: 4000 }],
    media: { maxVideos: 1 },
  },
  {
    id: "twitch",
    name: "Twitch",
    icon: "twitch",
    color: "#9146FF",
    texts: [{ field: "streamTitle", maxCharacters: 140 }],
    media: {},
  },
  {
    id: "bluesky",
    name: "Bluesky",
    icon: "bluesky",
    color: "#1185FE",
    texts: [{ field: "post", maxCharacters: 300 }],
    media: { maxImages: 4 },
  },
  {
    id: "threads",
    name: "Threads",
    icon: "threads",
    color: "#000000",
    texts: [{ field: "post", maxCharacters: 500 }],
    media: { maxImages: 10 },
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "linkedin",
    color: "#0A66C2",
    texts: [{ field: "post", maxCharacters: 3000 }],
    media: { maxImages: 20 },
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "facebook",
    color: "#1877F2",
    texts: [{ field: "post", maxCharacters: 63206 }],
    media: {},
  },
];

/** The catalogue's ids, in order. firestore.rules lists the same ones. */
export const PlatformIds = PlatformCatalogue.map((platform) => platform.id);

export function findPlatform(id: string): Platform | undefined {
  return PlatformCatalogue.find((platform) => platform.id === id);
}

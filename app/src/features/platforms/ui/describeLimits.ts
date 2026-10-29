// File : /TeamSamsara.Workflow/app/src/features/platforms/ui/describeLimits.ts
// Version : 1.0.0
// Latest commit: feature/workspace-settings
// Author : Gerrah
// Purpose : A platform's limits in one line, for the platforms table and,
// later, the post editor.

import type { Platform } from "../catalogue/platformTypes";
import { PlatformFieldText, PlatformLimitText } from "./platformsContent";

/** "Post 280 characters · up to 4 images · 1 video" */
export function describeLimits(platform: Platform): string {
  const parts = platform.texts.map((limit) =>
    PlatformLimitText.characters(
      PlatformFieldText[limit.field],
      limit.maxCharacters,
    ),
  );
  const { maxImages, maxVideos, maxHashtags } = platform.media;
  if (maxHashtags) parts.push(PlatformLimitText.hashtags(maxHashtags));
  if (maxImages) parts.push(PlatformLimitText.images(maxImages));
  if (maxVideos) parts.push(PlatformLimitText.videos(maxVideos));
  return parts.join(PlatformLimitText.separator);
}

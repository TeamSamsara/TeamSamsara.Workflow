// File : /TeamSamsara.Workflow/app/src/features/platforms/catalogue/platformTypes.ts
// Version : 1.0.0
// Latest commit: feature/workspace-settings
// Author : Gerrah
// Purpose : A platform from the built-in catalogue and the limits a post for it
// has to fit: how long each text may be, and how many images, videos and
// hashtags it may carry.

import type { IconName } from "@/shared/icons/iconRegistry";

/** The texts a post can have, depending on the platform. */
export type PlatformTextField =
  "post" | "caption" | "title" | "description" | "streamTitle";

export interface TextLimit {
  field: PlatformTextField;
  /** Most characters, counted the way people see them (see textLimits.ts). */
  maxCharacters: number;
}

export interface MediaLimits {
  maxImages?: number;
  maxVideos?: number;
  maxHashtags?: number;
}

export interface Platform {
  /** Stable id, saved in the workspace's list of switched-on platforms. */
  id: string;
  name: string;
  icon: IconName;
  /** The brand colour behind the logo. */
  color: string;
  texts: readonly TextLimit[];
  media: MediaLimits;
}

/** A platform with whether this workspace uses it. */
export interface PlatformSetting {
  platform: Platform;
  enabled: boolean;
}

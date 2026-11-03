// File : /TeamSamsara.Workflow/app/src/features/platforms/catalogue/platformTypes.ts
// Version : 1.1.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : A platform from the built-in catalogue and the limits a post for it
// has to fit: how long each text may be, and how many images, videos and
// hashtags it may carry.

import type { IconName } from "@/shared/icons/iconRegistry";

/** The texts a post can have, depending on the platform. */
export type PlatformTextField =
  "post" | "caption" | "title" | "description" | "streamTitle" | "article";

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

/** Another kind of post on the same platform, e.g. an X Article. */
export interface PlatformFormat {
  id: string;
  name: string;
  texts: readonly TextLimit[];
}

/**
 * A paid tier that changes the limits, e.g. X Premium. A workspace says
 * whether its account has it; the post editor then uses these limits.
 */
export interface PlatformUpgrade {
  name: string;
  /** Replace the platform's own text limits of the same field. */
  texts: readonly TextLimit[];
  /** Kinds of post only the paid tier can make. */
  formats: readonly PlatformFormat[];
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
  upgrade?: PlatformUpgrade;
}

/** A platform with whether this workspace uses it, and has its paid tier. */
export interface PlatformSetting {
  platform: Platform;
  enabled: boolean;
  upgraded: boolean;
  /** The limits that apply to this workspace (the paid tier's, when it has it). */
  limits: EffectiveLimits;
}

export interface EffectiveLimits {
  texts: readonly TextLimit[];
  media: MediaLimits;
  /** Extra kinds of post, from the paid tier. */
  formats: readonly PlatformFormat[];
}

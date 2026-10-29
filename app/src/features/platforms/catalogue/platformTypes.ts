// File : /TeamSamsara.Workflow/app/src/features/platforms/catalogue/platformTypes.ts
// Version : 1.1.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : A platform from the built-in catalogue and the limits a post for it
// has to fit: how long each text may be, and how many images, videos and
// hashtags it may carry. Some platforms have a paid tier (X Premium) that
// raises the limits and adds kinds of post (X Articles).

import type { IconName } from "@/shared/icons/iconRegistry";

/** The texts a post can have, depending on the platform. */
export type PlatformTextField =
  "post" | "caption" | "title" | "description" | "streamTitle" | "articleBody";

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

/** One kind of thing to publish on a platform: a regular post, an article… */
export interface PostKind {
  /** Stable id: "post" for the regular kind. */
  id: string;
  name: string;
  texts: readonly TextLimit[];
  media: MediaLimits;
}

/** What a platform's paid tier changes, for workspaces whose account has it. */
export interface PremiumTier {
  /** The tier's name, e.g. "X Premium". */
  name: string;
  /** The regular post's limits with the tier. */
  texts: readonly TextLimit[];
  media: MediaLimits;
  /** Kinds of post only the tier can make. */
  extraKinds: readonly PostKind[];
}

export interface Platform {
  /** Stable id, saved in the workspace's list of switched-on platforms. */
  id: string;
  name: string;
  icon: IconName;
  /** The brand colour behind the logo. */
  color: string;
  /** The regular post's limits. */
  texts: readonly TextLimit[];
  media: MediaLimits;
  premium?: PremiumTier;
}

/** A platform with whether this workspace uses it, and has its paid tier. */
export interface PlatformSetting {
  platform: Platform;
  enabled: boolean;
  /** Only meaningful when the platform has a paid tier. */
  hasPremium: boolean;
}

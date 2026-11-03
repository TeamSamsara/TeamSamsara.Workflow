// File : /TeamSamsara.Workflow/app/src/shared/components/Avatar/Avatar.tsx
// Version : 1.1.0
// Latest commit: fix/avatar-fallback
// Author : Gerrah
// Purpose : A person's round picture, or their initials when there is no photo
// or it can't be loaded. Decorative, because the name is always written next to it.

import { useState } from "react";
import { classNames } from "@/lib/classNames";
import { avatarInitials } from "./avatarInitials";
import styles from "./Avatar.module.css";

export type AvatarSize = "small" | "medium" | "large";

interface AvatarProps {
  name: string;
  /** Photo URL. Initials show when it is missing. */
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({ name, src, size = "medium", className }: AvatarProps) {
  // The photo that failed to load, so a new one is tried again.
  const [failed, setFailed] = useState<string | null>(null);
  const shown = src && src !== failed ? src : null;
  return (
    <span
      className={classNames(styles.avatar, className)}
      data-size={size}
      aria-hidden
    >
      {shown ? (
        <img
          src={shown}
          alt=""
          className={styles.image}
          onError={() => setFailed(shown)}
        />
      ) : (
        avatarInitials(name)
      )}
    </span>
  );
}

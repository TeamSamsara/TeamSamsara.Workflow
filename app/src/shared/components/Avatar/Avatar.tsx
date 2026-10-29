// File : /TeamSamsara.Workflow/app/src/shared/components/Avatar/Avatar.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : A person's round picture, or their initials when there is no photo. Decorative,
// because the name is always written next to it.

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
  return (
    <span
      className={classNames(styles.avatar, className)}
      data-size={size}
      aria-hidden
    >
      {src ? (
        <img src={src} alt="" className={styles.image} />
      ) : (
        avatarInitials(name)
      )}
    </span>
  );
}

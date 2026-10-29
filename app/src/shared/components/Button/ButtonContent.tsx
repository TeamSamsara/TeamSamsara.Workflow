// File : /TeamSamsara.Workflow/app/src/shared/components/Button/ButtonContent.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : What goes inside every button: the start icon (or a spinner while busy), the
// label and the end icon.

import type { ReactNode } from "react";
import { Icon } from "@/shared/icons/Icon";
import type { IconName } from "@/shared/icons/iconRegistry";
import { Spinner } from "../Spinner/Spinner";

interface ButtonContentProps {
  iconStart?: IconName;
  iconEnd?: IconName;
  isLoading?: boolean;
  children?: ReactNode;
}

export function ButtonContent({
  iconStart,
  iconEnd,
  isLoading = false,
  children,
}: ButtonContentProps) {
  return (
    <>
      {isLoading ? (
        <Spinner label={null} />
      ) : iconStart ? (
        <Icon name={iconStart} />
      ) : null}
      {children}
      {iconEnd ? <Icon name={iconEnd} /> : null}
    </>
  );
}

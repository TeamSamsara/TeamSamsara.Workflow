// File : /TeamSamsara.Workflow/app/src/shared/components/Button/LinkButton.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : A router link that looks like a button, for actions that go to another page.

import { Link, type LinkProps } from "react-router-dom";
import { ButtonContent } from "./ButtonContent";
import { buttonLook } from "./buttonLook";
import type { ButtonLookProps } from "./buttonTypes";

type LinkButtonProps = LinkProps & ButtonLookProps;

export function LinkButton({
  variant = "secondary",
  size = "medium",
  fullWidth = false,
  iconStart,
  iconEnd,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link {...rest} {...buttonLook(variant, size, fullWidth, className)}>
      <ButtonContent iconStart={iconStart} iconEnd={iconEnd}>
        {children}
      </ButtonContent>
    </Link>
  );
}

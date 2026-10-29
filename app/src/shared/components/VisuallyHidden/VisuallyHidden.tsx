// File : /TeamSamsara.Workflow/app/src/shared/components/VisuallyHidden/VisuallyHidden.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : Text that screen readers read but nobody sees, for labels a design leaves out.

import type { ComponentPropsWithoutRef } from "react";
import { classNames } from "@/lib/classNames";
import styles from "./VisuallyHidden.module.css";

export function VisuallyHidden({
  className,
  ...rest
}: ComponentPropsWithoutRef<"span">) {
  return <span {...rest} className={classNames(styles.hidden, className)} />;
}

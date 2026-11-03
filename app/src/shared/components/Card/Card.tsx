// File : /TeamSamsara.Workflow/app/src/shared/components/Card/Card.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : The white (or slate, in dark mode) box that groups a part of a page. It stacks
// its children with the standard gap; what goes inside is up to the page.

import type { ElementType, HTMLAttributes } from "react";
import { classNames } from "@/lib/classNames";
import styles from "./Card.module.css";

interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Element to render: a section with a heading, an article, a list item or a plain div. */
  as?: "section" | "div" | "article" | "li";
  /** default: 20px all round. compact: less above and below, for a card holding a table. none: no padding. */
  padding?: "default" | "compact" | "none";
}

export function Card({
  as = "section",
  padding = "default",
  className,
  children,
  ...rest
}: CardProps) {
  const Element: ElementType = as;

  return (
    <Element
      {...rest}
      className={classNames(styles.card, className)}
      data-padding={padding}
    >
      {children}
    </Element>
  );
}

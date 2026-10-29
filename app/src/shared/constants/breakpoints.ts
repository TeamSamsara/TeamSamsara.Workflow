// File : /TeamSamsara.Workflow/app/src/shared/constants/breakpoints.ts
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : The screen widths where layouts change. CSS cannot read these, so the
// same numbers are written in the stylesheets, each with a comment pointing here.

export const Breakpoints = {
  /** Phones: headings shrink, page padding tightens. */
  small: 640,
  /** Tablets and narrow windows: the sidebar becomes a menu behind a button. */
  medium: 900,
} as const;

export type Breakpoint = keyof typeof Breakpoints;

/** A media query that matches at or below a breakpoint, for useMediaQuery. */
export function atOrBelow(breakpoint: Breakpoint): string {
  return `(max-width: ${Breakpoints[breakpoint]}px)`;
}

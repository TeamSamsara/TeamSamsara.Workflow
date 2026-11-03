// File : /TeamSamsara.Workflow/app/src/shared/components/Dropdown/DropdownPanel.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : The floating box a dropdown opens. It decides where it sits next
// to the trigger (placement and offset) and whether it stays in the page while
// closed, inert instead of hidden so its owner can animate it away. It has the
// app's menu look; what goes inside is up to the page.

import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import { useDropdownContext } from "./useDropdownContext";
import styles from "./Dropdown.module.css";

const defaultOffset = 6;

export type DropdownPlacement =
  "bottom-start" | "bottom-end" | "top-start" | "top-end";

interface DropdownPanelProps extends ComponentPropsWithoutRef<"div"> {
  /** Which side of the trigger the panel opens on, and which edge it lines up with. */
  placement?: DropdownPlacement;
  /** Gap between trigger and panel, in pixels. */
  offset?: number;
  /** Keep the panel in the page while closed (inert, not hidden), so the page can animate it in and out. */
  keepMounted?: boolean;
}

export function DropdownPanel({
  placement = "bottom-start",
  offset = defaultOffset,
  keepMounted = false,
  className,
  style,
  children,
  ...divProps
}: DropdownPanelProps) {
  const { setPanel, isOpen, panelId, triggerId } = useDropdownContext();

  if (!isOpen && !keepMounted) return null;

  const offsetStyle = {
    "--dropdown-offset": `${offset}px`,
    ...style,
  } as CSSProperties;

  return (
    <div
      {...divProps}
      ref={setPanel}
      className={className ? `${styles.panel} ${className}` : styles.panel}
      id={panelId}
      aria-labelledby={triggerId}
      inert={!isOpen}
      data-open={isOpen}
      data-placement={placement}
      style={offsetStyle}
    >
      {children}
    </div>
  );
}

// File : /TeamSamsara.Workflow/app/src/shared/components/HelpTip/HelpTip.tsx
// Version : 1.0.0
// Latest commit: fix/workflow-editor-simpler
// Author : Gerrah
// Purpose : A small "?" beside a label that opens a short explanation, so
// forms stay clean and the help is there for whoever wants it. Opens on click
// or Enter, closes on a second click, Escape, or a click anywhere else.

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/shared/icons/Icon";
import { HelpTipText } from "./helpTipContent";
import styles from "./HelpTip.module.css";

interface HelpTipProps {
  /** What the help is about, for screen readers ("Give to"). */
  topic: string;
  children: ReactNode;
}

export function HelpTip({ topic, children }: HelpTipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) return;
    function closeOnOutside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <span ref={root} className={styles.root}>
      <button
        type="button"
        className={styles.button}
        aria-label={HelpTipText.open(topic)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={(event) => {
          // Inside a <label>, a click would also focus the field.
          event.preventDefault();
          setIsOpen((open) => !open);
        }}
      >
        <Icon name="help" />
      </button>
      {isOpen ? (
        <span id={panelId} role="note" className={styles.panel}>
          {children}
        </span>
      ) : null}
    </span>
  );
}

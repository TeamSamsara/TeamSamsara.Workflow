// File : /TeamSamsara.Workflow/app/src/shared/components/Modal/Modal.tsx
// Version : 1.1.0
// Latest commit: fix/modal-and-account-notifications
// Author : Gerrah
// Purpose : The generic dialog: a titled card over a dimmed page, built on the browser's own
// dialog so focus stays inside and the page behind cannot be used. It opens when it appears
// and closes when it is removed; what it says and which buttons it has is up to the caller.

import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { classNames } from "@/lib/classNames";
import { IconButton } from "../Button/IconButton";
import { ModalText } from "./modalContent";
import styles from "./Modal.module.css";

interface ModalProps {
  title: string;
  /** A line under the title saying what happens next. */
  description?: ReactNode;
  /** What the dialog says and does: text and fields. */
  children?: ReactNode;
  /** The buttons along the bottom, main action last. */
  footer?: ReactNode;
  /** Called when the person presses Esc, the close button or the dimmed page, if dismissible. */
  onClose?: () => void;
  /** False while something is in progress, so nothing closes the dialog. */
  dismissible?: boolean;
  /** wide: for forms with several columns. */
  size?: "default" | "wide";
  className?: string;
}

export function Modal({
  title,
  description,
  children,
  footer,
  onClose,
  dismissible = true,
  size = "default",
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const canClose = dismissible && Boolean(onClose);

  // Opening as a modal makes the browser trap focus and dim everything else.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) dialog.showModal();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, []);

  // Esc is handled here so the caller decides whether the dialog may close.
  function handleCancel(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (canClose) onClose?.();
  }

  /** Whether a point is outside the card (on the dimmed backdrop). */
  function isOutside(dialog: HTMLDialogElement, x: number, y: number) {
    const box = dialog.getBoundingClientRect();
    return x < box.left || x > box.right || y < box.top || y > box.bottom;
  }

  // Where the press began: a drag that starts inside the card (selecting
  // text, a right-click drag) and ends outside it must not close it.
  const pressedOutside = useRef(false);

  function handlePointerDown(event: PointerEvent<HTMLDialogElement>) {
    pressedOutside.current =
      event.target === event.currentTarget &&
      event.button === 0 &&
      isOutside(event.currentTarget, event.clientX, event.clientY);
  }

  // A click outside the card lands on the dialog itself; one inside is within its box.
  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    const startedOutside = pressedOutside.current;
    pressedOutside.current = false;
    if (!canClose || !startedOutside || event.target !== event.currentTarget)
      return;
    if (isOutside(event.currentTarget, event.clientX, event.clientY))
      onClose?.();
  }

  return (
    <dialog
      ref={dialogRef}
      className={classNames(styles.dialog, className)}
      data-size={size}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={handleCancel}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className={styles.description}>
                {description}
              </p>
            ) : null}
          </div>
          {canClose ? (
            <IconButton
              icon="close"
              label={ModalText.close}
              variant="ghost"
              onClick={onClose}
            />
          ) : null}
        </header>
        {children}
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </dialog>
  );
}

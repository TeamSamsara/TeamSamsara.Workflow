// File : /TeamSamsara.Workflow/app/src/shared/components/Toast/ToastViewport.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : Draws the toast stack in the top-right corner of the screen, one Toast per message in the list.

import { Toast } from "./Toast";
import { useToast, useToastList } from "./useToast";
import { ToastText } from "./toastContent";
import styles from "./ToastViewport.module.css";

export function ToastViewport() {
  const toasts = useToastList();
  const { dismiss, remove } = useToast();

  return (
    <div
      className={styles.viewport}
      role="region"
      aria-label={ToastText.viewport}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={dismiss}
          onRemove={remove}
        />
      ))}
    </div>
  );
}

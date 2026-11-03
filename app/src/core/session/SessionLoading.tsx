// File : /TeamSamsara.Workflow/app/src/core/session/SessionLoading.tsx
// Version : 1.0.0
// Latest commit: core/session
// Author : Gerrah
// Purpose : The spinner shown for the moment the session is being checked.

import { Spinner } from "@/shared/components/Spinner/Spinner";
import { SessionText } from "./sessionContent";
import styles from "./SessionGate.module.css";

export function SessionLoading() {
  return (
    <div className={styles.page}>
      <Spinner label={SessionText.loading} />
    </div>
  );
}

// File : /TeamSamsara.Workflow/app/src/app/AppLoading.tsx
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : What shows for the moment the first page is still loading: a spinner
// in the middle of the page, announced to screen readers.

import { Spinner } from "@/shared/components/Spinner/Spinner";
import styles from "./AppError.module.css";

export function AppLoading() {
  return (
    <div className={styles.page}>
      <Spinner />
    </div>
  );
}

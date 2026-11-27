// File : /TeamSamsara.Workflow/app/src/app/layouts/AppLayout/ViewingAsBar.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-view-as-role
// Author : Gerrah
// Purpose : The bar on every page while viewing as a role: which role, that
// it only hides what the role can't see (nothing is done as them), and Stop
// viewing.

import { usePermissions } from "@/core/access";
import { Button } from "@/shared/components/Button/Button";
import { Icon } from "@/shared/icons/Icon";
import { AppLayoutText as Text } from "./appLayoutContent";
import styles from "./AppLayout.module.css";

export function ViewingAsBar() {
  const access = usePermissions();
  if (!access.viewingAs) return null;
  const name =
    access.roles?.roles.find((role) => role.id === access.viewingAs)?.name ??
    access.viewingAs;
  return (
    <div className={styles.viewingAs} role="status">
      <Icon name="showPassword" />
      <span className={styles.viewingText}>
        <b>{Text.viewingAs(name)}</b> {Text.viewingNote}
      </span>
      <Button
        size="small"
        className={styles.stopViewing}
        onClick={access.stopViewing}
      >
        {Text.stopViewing}
      </Button>
    </div>
  );
}

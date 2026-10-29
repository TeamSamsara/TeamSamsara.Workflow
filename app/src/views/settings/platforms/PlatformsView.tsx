// File : /TeamSamsara.Workflow/app/src/views/settings/platforms/PlatformsView.tsx
// Version : 1.0.0
// Latest commit: feature/workspace-settings
// Author : Gerrah
// Purpose : Settings → Platforms: the built-in platform list with the limits
// Workflow checks, and which ones this workspace uses. Switches save at once.

import { usePermissions } from "@/core/access";
import { PlatformsTable, usePlatforms } from "@/features/platforms";
import { Banner } from "@/shared/components/Banner/Banner";
import { PlatformsViewText as Text } from "./platformsViewContent";
import styles from "./PlatformsView.module.css";

export function PlatformsView() {
  const { settings } = usePlatforms();
  const canChange = usePermissions().can("manageSettings");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>{Text.title}</h2>
        <p className={styles.muted}>{Text.description}</p>
      </header>
      <Banner tone="info">{canChange ? Text.note : Text.readOnly}</Banner>
      <section className={styles.card}>
        <PlatformsTable settings={settings} canChange={canChange} />
      </section>
    </div>
  );
}

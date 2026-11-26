// File : /TeamSamsara.Workflow/app/src/features/whats-new/ui/WhatsNewPage.tsx
// Version : 1.0.0
// Latest commit: feature/whats-new
// Author : Gerrah
// Purpose : Help › What's new: every release, newest first, its changes
// grouped as New, Improved and Fixed (with a filter), each linking to the help
// article that explains it. Administrators also see changes only for them.

import {
  ChangeKinds,
  compareVersions,
  releaseForViewer,
  releases,
  type ChangeKind,
} from "@releases/index";
import { useState } from "react";
import { Link } from "react-router-dom";
import { usePermissions } from "@/core/access";
import { useDisplayTime } from "@/core/workspace";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import { docsPath } from "@/shared/constants/routePaths";
import { releaseDay, WhatsNewText as Text } from "./whatsNewContent";
import styles from "./WhatsNew.module.css";

type Filter = "all" | ChangeKind;

export function WhatsNewPage() {
  const access = usePermissions();
  const time = useDisplayTime();
  const [filter, setFilter] = useState<Filter>("all");
  const isAdmin = access.can("administrator");
  const shown = [...releases]
    .sort((a, b) => compareVersions(b.version, a.version))
    .map((release) => releaseForViewer(release, isAdmin));

  return (
    <div className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{Text.pageTitle}</h1>
          <p className={styles.muted}>{Text.pageDescription}</p>
        </div>
        <SegmentedControl
          label={Text.filterLabel}
          options={(["all", ...ChangeKinds] as const).map((value) => ({
            value,
            label: value === "all" ? Text.all : Text.kinds[value],
          }))}
          value={filter}
          onChange={setFilter}
        />
      </div>
      {shown.length === 0 ? <p className={styles.muted}>{Text.none}</p> : null}
      {shown.map((release, index) => {
        const changes = release.changes.filter(
          (change) => filter === "all" || change.kind === filter,
        );
        return (
          <section
            key={release.version}
            className={styles.release}
            aria-labelledby={`release-${release.version}`}
          >
            <div className={styles.releaseHead}>
              <h2
                id={`release-${release.version}`}
                className={styles.releaseTitle}
              >
                {Text.version(release.version)}
              </h2>
              {index === 0 ? (
                <span className={styles.latest}>{Text.latest}</span>
              ) : null}
              <span className={styles.date}>
                {releaseDay(release.date, time.dateFormat)}
              </span>
            </div>
            <p className={styles.muted}>{release.summary}</p>
            {changes.length === 0 ? (
              <p className={styles.muted}>{Text.nothingOfKind}</p>
            ) : (
              <ul className={styles.changes}>
                {changes.map((change) => (
                  <li key={change.title} className={styles.item}>
                    <span className={styles.kind} data-kind={change.kind}>
                      {Text.kinds[change.kind]}
                    </span>
                    <span className={styles.itemText}>
                      <span className={styles.itemTitle}>
                        {change.title}
                        {change.audience === "admins" ? (
                          <span className={styles.admins}>{Text.admins}</span>
                        ) : null}
                      </span>
                      <span className={styles.muted}>{change.body}</span>
                    </span>
                    {change.article ? (
                      <Link
                        to={docsPath(change.article)}
                        className={styles.itemLink}
                      >
                        {Text.howItWorks}
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

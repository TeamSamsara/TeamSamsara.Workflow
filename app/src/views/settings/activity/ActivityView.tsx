// File : /TeamSamsara.Workflow/app/src/views/settings/activity/ActivityView.tsx
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Settings › Activity, for Administrators: the newest 200 changes to
// people, roles, groups and settings, who made them and when, filtered by
// area. The server writes the history; nobody edits or deletes it.

import {
  collection,
  limit,
  orderBy,
  query,
  type DocumentData,
} from "firebase/firestore";
import { useMemo, useState } from "react";
import {
  useLiveQueries,
  readDate,
  readOptionalString,
  readString,
} from "@/core/data";
import { useDisplayTime } from "@/core/workspace";
import { memberName, useMembers } from "@/features/members";
import { Banner } from "@/shared/components/Banner/Banner";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { ActivityViewText as Text } from "./activityViewContent";
import styles from "./ActivityView.module.css";

type Area = keyof typeof Text.areas;
const areas: Area[] = ["all", "people", "roles", "groups", "settings", "tasks"];

interface ActivityEntry {
  id: string;
  area: string;
  summary: string;
  actorId: string | null;
  at: Date | null;
}

function readEntry(id: string, data: DocumentData): ActivityEntry {
  return {
    id,
    area: readString(data, "area"),
    summary: readString(data, "summary"),
    actorId: readOptionalString(data, "actorId"),
    at: readDate(data, "at"),
  };
}

export function ActivityView() {
  const [area, setArea] = useState<Area>("all");
  const members = useMembers();
  const time = useDisplayTime();
  const result = useLiveQueries(
    "activity:latest",
    (database) => [
      query(
        collection(database, "activity"),
        orderBy("at", "desc"),
        limit(200),
      ).withConverter({
        toFirestore: () => ({}),
        fromFirestore: (snapshot) => readEntry(snapshot.id, snapshot.data()),
      }),
    ],
    (entry) => entry.id,
  );
  const format = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        timeZone: time.timeZone,
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [time.timeZone],
  );
  const entries =
    result.status === "ready"
      ? (result.data ?? []).filter(
          (entry) => area === "all" || entry.area === area,
        )
      : [];
  const nameOf = (id: string | null) => {
    if (!id) return Text.system;
    const member = members.records.find((entry) => entry.id === id);
    return Text.by(member ? memberName(member) : Text.someone);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>{Text.title}</h2>
          <p className={styles.muted}>{Text.description}</p>
        </div>
        <SegmentedControl<Area>
          label={Text.show}
          options={areas.map((value) => ({ value, label: Text.areas[value] }))}
          value={area}
          onChange={setArea}
        />
      </header>
      {result.status === "loading" ? (
        <Spinner label={Text.loading} />
      ) : result.status === "error" ? (
        <Banner tone="error">{Text.failed}</Banner>
      ) : entries.length === 0 ? (
        <p className={styles.muted}>{Text.none}</p>
      ) : (
        <ul className={styles.list}>
          {entries.map((entry) => (
            <li key={entry.id} className={styles.entry}>
              <span className={styles.summary}>{entry.summary}</span>
              <span className={styles.meta}>
                {nameOf(entry.actorId)}
                {entry.at ? ` · ${format.format(entry.at)}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

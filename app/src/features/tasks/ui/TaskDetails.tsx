// File : /TeamSamsara.Workflow/app/src/features/tasks/ui/TaskDetails.tsx
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : The main part of a task page: how to do it (with its links), the
// post text per platform with a count and Copy, and the checklist to tick.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  checkText,
  findPlatform,
  PlatformFieldText,
  PlatformMark,
  type PlatformSetting,
} from "@/features/platforms";
import { Button } from "@/shared/components/Button/Button";
import { Checkbox } from "@/shared/components/Fields/Checkbox/Checkbox";
import { Tab } from "@/shared/components/Tabs/Tab";
import { TabList } from "@/shared/components/Tabs/TabList";
import { TabPanel } from "@/shared/components/Tabs/TabPanel";
import { Tabs } from "@/shared/components/Tabs/Tabs";
import { useToast } from "@/shared/components/Toast/useToast";
import { useCopyToClipboard } from "@/shared/hooks/useCopyToClipboard";
import { Icon } from "@/shared/icons/Icon";
import { setChecklist } from "../service/taskService";
import type { TaskRecord } from "../types/taskTypes";
import { TaskCardText as Text } from "./tasksContent";
import styles from "./TaskCards.module.css";

export function HowToCard({ task }: { task: TaskRecord }) {
  return (
    <section className={styles.card} aria-labelledby="task-howto">
      <h2 id="task-howto" className={styles.title}>
        {Text.howTo}
      </h2>
      <p className={task.notes ? styles.notes : styles.muted}>
        {task.notes || Text.noNotes}
      </p>
      {task.links && task.links.length > 0 ? (
        <ul className={styles.links} aria-label={Text.links}>
          {task.links.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                <Icon name="externalLink" />
                {link.label || link.url}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function PostTextCard({
  task,
  settings,
}: {
  task: TaskRecord;
  settings: readonly PlatformSetting[];
}) {
  const posts = task.posts ?? [];
  const [selected, setSelected] = useState(posts[0]?.platformId ?? "");
  const { copiedKey, copy } = useCopyToClipboard();
  if (posts.length === 0) return null;
  const current = posts.some((post) => post.platformId === selected)
    ? selected
    : posts[0].platformId;

  return (
    <section className={styles.card} aria-labelledby="task-posts">
      <h2 id="task-posts" className={styles.title}>
        {Text.posts}
      </h2>
      <Tabs value={current} onValueChange={setSelected}>
        <TabList label={Text.posts}>
          {posts.map((post) => {
            const platform = findPlatform(post.platformId);
            return platform ? (
              <Tab key={post.platformId} value={post.platformId}>
                <span className={styles.tabLabel}>
                  <PlatformMark platform={platform} size="small" />
                  {platform.name}
                </span>
              </Tab>
            ) : null;
          })}
        </TabList>
        {posts.map((post) => {
          const setting = settings.find(
            (entry) => entry.platform.id === post.platformId,
          );
          if (!setting) return null;
          const format = setting.limits.formats.find(
            (entry) => entry.id === post.formatId,
          );
          const fields = format ? format.texts : setting.limits.texts;
          return (
            <TabPanel
              key={post.platformId}
              value={post.platformId}
              className={styles.panel}
            >
              {fields.map((limit) => {
                const text = post.texts[limit.field] ?? "";
                const check = checkText(text, limit);
                const key = `${post.platformId}:${limit.field}`;
                return (
                  <div key={limit.field} className={styles.post}>
                    <span className={styles.label}>
                      {Text.fieldFor(
                        PlatformFieldText[limit.field],
                        setting.platform.name,
                      )}
                    </span>
                    <div className={styles.postText}>
                      {text || (
                        <span className={styles.muted}>{Text.empty}</span>
                      )}
                    </div>
                    <div className={styles.postFooter}>
                      <span className={styles.count} data-over={check.isOver}>
                        {check.count.toLocaleString()} /{" "}
                        {check.max.toLocaleString()}
                      </span>
                      <Button
                        size="small"
                        variant="ghost"
                        iconStart={copiedKey === key ? "check" : "copy"}
                        onClick={() => void copy(key, text)}
                        disabled={!text}
                      >
                        {copiedKey === key ? Text.copied : Text.copy}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </TabPanel>
          );
        })}
      </Tabs>
    </section>
  );
}

export function ChecklistCard({
  task,
  canTick,
}: {
  task: TaskRecord;
  canTick: boolean;
}) {
  const toast = useToast();
  const save = useMutation({
    mutationFn: (checklist: NonNullable<TaskRecord["checklist"]>) =>
      setChecklist(task.id, checklist),
    onError: () =>
      toast.show({ tone: "error", title: Text.checklistSaveFailed }),
  });
  const items = task.checklist ?? [];
  if (items.length === 0) return null;
  const done = items.filter((item) => item.done).length;

  return (
    <section className={styles.card} aria-labelledby="task-checklist">
      <header className={styles.header}>
        <h2 id="task-checklist" className={styles.title}>
          {Text.checklist}
        </h2>
        <span className={styles.muted}>
          {Text.checklistProgress(done, items.length)}
        </span>
      </header>
      <ul className={styles.checklist}>
        {items.map((item) => (
          <li key={item.id} data-done={item.done}>
            <Checkbox
              label={item.text}
              checked={item.done}
              disabled={!canTick}
              onChange={(event) =>
                save.mutate(
                  items.map((entry) =>
                    entry.id === item.id
                      ? { ...entry, done: event.target.checked }
                      : entry,
                  ),
                )
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

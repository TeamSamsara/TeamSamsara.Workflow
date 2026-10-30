// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/PostTextEditor.tsx
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : A task's post text: a tab per platform it goes on, with a box per
// text the platform has (YouTube has a title and a description) and a count
// against that platform's limit. With a paid tier such as X Premium, the
// longer limits apply and its extra kinds of post (an X Article) can be chosen.

import { useState } from "react";
import {
  checkText,
  findPlatform,
  PlatformFieldText,
  PlatformMark,
  type PlatformSetting,
  type TextLimit,
} from "@/features/platforms";
import { ButtonContent } from "@/shared/components/Button/ButtonContent";
import { buttonLook } from "@/shared/components/Button/buttonLook";
import { Button } from "@/shared/components/Button/Button";
import { Dropdown } from "@/shared/components/Dropdown/Dropdown";
import { DropdownItem } from "@/shared/components/Dropdown/DropdownItem";
import { DropdownPanel } from "@/shared/components/Dropdown/DropdownPanel";
import { DropdownTrigger } from "@/shared/components/Dropdown/DropdownTrigger";
import { TextArea } from "@/shared/components/Fields/TextArea/TextArea";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import { Tab } from "@/shared/components/Tabs/Tab";
import { TabList } from "@/shared/components/Tabs/TabList";
import { TabPanel } from "@/shared/components/Tabs/TabPanel";
import { Tabs } from "@/shared/components/Tabs/Tabs";
import { WorkflowLimits, type PlatformPost } from "../types/workflowTypes";
import { PostTextEditorText as Text, StepEditorText } from "./workflowsContent";
import styles from "./PostTextEditor.module.css";

interface PostTextEditorProps {
  posts: readonly PlatformPost[];
  onChange: (posts: PlatformPost[]) => void;
  /** Every platform, with whether it's on and the limits that apply. */
  settings: readonly PlatformSetting[];
}

const normalPost = "post";

function TextCount({ text, limit }: { text: string; limit: TextLimit }) {
  const check = checkText(text, limit);
  return (
    <span className={styles.count} data-over={check.isOver}>
      {check.isOver ? `${Text.overBy(-check.remaining)} · ` : null}
      {Text.count(check.count, check.max)}
    </span>
  );
}

export function PostTextEditor({
  posts,
  onChange,
  settings,
}: PostTextEditorProps) {
  const [selected, setSelected] = useState(posts[0]?.platformId ?? "");
  const current = posts.some((post) => post.platformId === selected)
    ? selected
    : (posts[0]?.platformId ?? "");
  const addable = settings.filter(
    (setting) =>
      setting.enabled &&
      !posts.some((post) => post.platformId === setting.platform.id),
  );
  const anyEnabled = settings.some((setting) => setting.enabled);

  function update(platformId: string, changes: Partial<PlatformPost>) {
    onChange(
      posts.map((post) =>
        post.platformId === platformId ? { ...post, ...changes } : post,
      ),
    );
  }

  function add(platformId: string) {
    onChange([...posts, { platformId, formatId: null, texts: {} }]);
    setSelected(platformId);
  }

  const addMenu =
    addable.length > 0 ? (
      <Dropdown>
        <DropdownTrigger popup="menu" {...buttonLook("ghost", "small", false)}>
          <ButtonContent iconStart="add">{Text.addPlatform}</ButtonContent>
        </DropdownTrigger>
        <DropdownPanel role="menu" aria-label={Text.addPlatform}>
          {addable.map(({ platform }) => (
            <DropdownItem
              key={platform.id}
              role="menuitem"
              onSelect={() => add(platform.id)}
              className={styles.menuItem}
            >
              <PlatformMark platform={platform} size="small" />
              {platform.name}
            </DropdownItem>
          ))}
        </DropdownPanel>
      </Dropdown>
    ) : null;

  if (posts.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.muted}>
          {anyEnabled ? Text.none : Text.noPlatforms}
        </p>
        {addMenu}
      </div>
    );
  }

  return (
    <Tabs value={current} onValueChange={setSelected}>
      <div className={styles.tabsRow}>
        <TabList label={Text.platforms} className={styles.tabList}>
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
        {addMenu}
      </div>

      {posts.map((post) => {
        const setting = settings.find(
          (entry) => entry.platform.id === post.platformId,
        );
        if (!setting) return null;
        const { platform, limits } = setting;
        const format = limits.formats.find(
          (entry) => entry.id === post.formatId,
        );
        const fields = format ? format.texts : limits.texts;
        return (
          <TabPanel
            key={post.platformId}
            value={post.platformId}
            className={styles.panel}
          >
            {limits.formats.length > 0 ? (
              <SegmentedControl
                label={Text.format}
                options={[
                  { value: normalPost, label: Text.normalPost },
                  ...limits.formats.map((entry) => ({
                    value: entry.id,
                    label: entry.name,
                  })),
                ]}
                value={format ? format.id : normalPost}
                onChange={(value) =>
                  update(post.platformId, {
                    formatId: value === normalPost ? null : value,
                  })
                }
              />
            ) : null}
            {fields.map((limit) => {
              const text = post.texts[limit.field] ?? "";
              return (
                <TextArea
                  key={limit.field}
                  label={Text.fieldLabel(
                    PlatformFieldText[limit.field],
                    platform.name,
                  )}
                  value={text}
                  rows={
                    limit.maxCharacters > 1000
                      ? 6
                      : limit.maxCharacters > 150
                        ? 4
                        : 2
                  }
                  maxLength={WorkflowLimits.postText}
                  onChange={(event) =>
                    update(post.platformId, {
                      texts: {
                        ...post.texts,
                        [limit.field]: event.target.value,
                      },
                    })
                  }
                  footer={
                    <>
                      <span>{StepEditorText.gapsHint}</span>
                      <TextCount text={text} limit={limit} />
                    </>
                  }
                />
              );
            })}
            <Button
              variant="ghost"
              size="small"
              iconStart="trash"
              onClick={() =>
                onChange(
                  posts.filter((entry) => entry.platformId !== post.platformId),
                )
              }
              className={styles.remove}
            >
              {Text.removePlatform(platform.name)}
            </Button>
          </TabPanel>
        );
      })}
    </Tabs>
  );
}

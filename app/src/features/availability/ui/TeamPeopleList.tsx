// File : /TeamSamsara.Workflow/app/src/features/availability/ui/TeamPeopleList.tsx
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The people on Team availability, grouped by people tag. Tick a
// tag to show or hide its whole group, click a name to show or hide one
// person, drag (or use the arrow keys on the handle) to reorder within a
// group; all of it is saved for the viewer only. In Hours, each person shows
// what they're doing at the picked hour; in People, their free hours each day
// sit on their row. People with Tag people can edit tags right here.

import type { CSSProperties } from "react";
import type { ColouredItem } from "@/core/data";
import { TagEditor } from "@/features/people-tags";
import { Avatar } from "@/shared/components/Avatar/Avatar";
import { Button } from "@/shared/components/Button/Button";
import { useSortableList } from "@/shared/hooks/useSortableList";
import { Icon } from "@/shared/icons/Icon";
import type { PersonTime } from "../model/freeBusy";
import type { ListPerson, TeamSection } from "../model/teamSections";
import { TeamViewText as Text } from "./teamViewContent";
import styles from "./TeamView.module.css";

export interface TeamRowPerson extends ListPerson {
  photoUrl: string | null;
  filled: boolean;
  time: PersonTime;
}

export type PersonState = "free" | "busy" | "unknown";

/** One person's day in the People view. */
export interface DayCell {
  kind: "free" | "unavailable" | "unknown";
  text: string;
  label: string;
}

interface TeamPeopleListProps {
  sections: readonly TeamSection<TeamRowPerson>[];
  tags: readonly ColouredItem[];
  hidden: ReadonlySet<string>;
  onShow: (ids: readonly string[], show: boolean) => void;
  onReorder: (sectionKey: string, ids: string[]) => void;
  /** "Comparing 8 of 14". */
  comparing: string;
  /** Hours: what each person is doing at the picked hour. */
  stateOf?: (person: TeamRowPerson) => PersonState;
  /** Hours: the picked hour, over the states. */
  stateHead?: string;
  /** People: the days' labels and each person's day. */
  days?: readonly string[];
  dayOf?: (person: TeamRowPerson, dayIndex: number) => DayCell;
  pickedDay?: number;
  onPickDay?: (dayIndex: number) => void;
  canTag: boolean;
  isTagging: boolean;
  onTagging: (on: boolean) => void;
}

function Section({
  section,
  label,
  tag,
  rest,
}: {
  section: TeamSection<TeamRowPerson>;
  label: string | null;
  tag: ColouredItem | undefined;
  rest: Omit<TeamPeopleListProps, "sections" | "comparing">;
}) {
  const ids = section.people.map((person) => person.id);
  const allOn = ids.every((id) => !rest.hidden.has(id));
  const sortable = useSortableList({
    ids,
    onReorder: (next) => rest.onReorder(section.key, next),
  });
  const people = rest.days !== undefined;

  return (
    <>
      {label ? (
        <li className={styles.section}>
          <button
            type="button"
            className={styles.sectionToggle}
            aria-pressed={allOn}
            onClick={() => rest.onShow(ids, !allOn)}
          >
            <span className={styles.box} data-on={allOn || undefined}>
              {allOn ? <Icon name="check" /> : null}
            </span>
            {tag ? (
              <span
                className={styles.tagDot}
                style={{ "--tag-color": tag.color } as CSSProperties}
                aria-hidden="true"
              />
            ) : null}
            {label}
            <span className={styles.count}>· {section.people.length}</span>
          </button>
        </li>
      ) : null}
      {section.people.map((person, index) => {
        const on = !rest.hidden.has(person.id);
        const state = on
          ? person.filled
            ? (rest.stateOf?.(person) ?? null)
            : "unknown"
          : null;
        const row = sortable.rowProps(person.id, index);
        return (
          <li
            key={person.id}
            className={styles.person}
            data-off={on ? undefined : true}
            data-people={people || undefined}
            {...row}
          >
            <span className={styles.who}>
              <button
                type="button"
                className={styles.handle}
                aria-label={Text.reorder(person.name)}
                {...sortable.handleProps(person.id, index)}
              >
                <Icon name="dragHandle" />
              </button>
              <button
                type="button"
                className={styles.name}
                aria-pressed={on}
                aria-label={Text.personToggle(person.name, on)}
                onClick={() => rest.onShow([person.id], !on)}
              >
                <span className={styles.shownDot} data-on={on || undefined} />
                <Avatar name={person.name} src={person.photoUrl} size="small" />
                <span className={styles.nameText}>{person.name}</span>
              </button>
              {!people ? (
                <span
                  className={styles.state}
                  data-state={on ? state : "hidden"}
                >
                  {on ? (state ? Text.states[state] : "") : Text.states.hidden}
                </span>
              ) : null}
            </span>
            {rest.isTagging ? (
              <span className={styles.tagRow}>
                <TagEditor
                  memberId={person.id}
                  name={person.name}
                  tagIds={person.tagIds}
                  tags={rest.tags}
                  canEdit
                  compact
                />
              </span>
            ) : null}
            {people && rest.dayOf ? (
              <span className={styles.days}>
                {rest.days?.map((day, dayIndex) => {
                  const cell = rest.dayOf?.(person, dayIndex);
                  if (!cell) return null;
                  return (
                    <button
                      key={day}
                      type="button"
                      className={styles.dayCell}
                      data-kind={cell.kind}
                      data-picked={rest.pickedDay === dayIndex || undefined}
                      aria-label={cell.label}
                      onClick={() => rest.onPickDay?.(dayIndex)}
                    >
                      {cell.text}
                    </button>
                  );
                })}
              </span>
            ) : null}
          </li>
        );
      })}
    </>
  );
}

export function TeamPeopleList(props: TeamPeopleListProps) {
  const { sections, tags, comparing, ...rest } = props;
  const hasTags = sections.some((section) => section.tagId !== null);
  return (
    <div className={styles.listCard} data-people={rest.days ? true : undefined}>
      <div className={styles.listHead}>
        <span className={styles.comparing}>{comparing}</span>
        {rest.canTag ? (
          <Button
            variant="ghost"
            size="small"
            iconStart={rest.isTagging ? "check" : "edit"}
            onClick={() => rest.onTagging(!rest.isTagging)}
          >
            {rest.isTagging ? Text.doneTags : Text.editTags}
          </Button>
        ) : null}
        {rest.stateHead ? (
          <span className={styles.stateHead}>{rest.stateHead}</span>
        ) : null}
        {rest.days ? (
          <span className={styles.days} aria-hidden="true">
            {rest.days.map((day, index) => (
              <button
                key={day}
                type="button"
                tabIndex={-1}
                className={styles.dayHead}
                data-picked={rest.pickedDay === index || undefined}
                onClick={() => rest.onPickDay?.(index)}
              >
                {day}
              </button>
            ))}
          </span>
        ) : null}
      </div>
      <ul
        className={styles.list}
        aria-label={`${Text.people}: ${Text.peopleHelp}`}
      >
        {sections.map((section) => {
          const tag = tags.find((entry) => entry.id === section.tagId);
          return (
            <Section
              key={section.key}
              section={section}
              tag={tag}
              label={tag ? tag.name : hasTags ? Text.untagged : null}
              rest={{ ...rest, tags }}
            />
          );
        })}
      </ul>
    </div>
  );
}

// File : /TeamSamsara.Workflow/app/src/features/events/ui/AudiencePicker.tsx
// Version : 1.0.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : "Who's in it": one search box that finds Everyone, work groups and
// people. A group stays one chip ("Bloom · 6 people") and follows its roster.
// Only those in it (plus whoever made it and View all) can see the event.

import { useId, useState, type KeyboardEvent } from "react";
import { Icon } from "@/shared/icons/Icon";
import {
  AudienceLimits,
  isEmptyAudience,
  type Audience,
} from "../types/audience";
import { AudiencePickerText as Text } from "./audienceContent";
import styles from "./AudiencePicker.module.css";

export interface AudienceOption {
  id: string;
  name: string;
}

export interface AudienceGroupOption extends AudienceOption {
  /** How many people are in it. */
  size: number;
}

interface AudiencePickerProps {
  value: Audience;
  onChange: (value: Audience) => void;
  groups: readonly AudienceGroupOption[];
  members: readonly AudienceOption[];
}

type Choice =
  | { kind: "everyone"; id: "everyone"; name: string }
  | { kind: "group"; id: string; name: string; size: number }
  | { kind: "member"; id: string; name: string };

const matches = (name: string, search: string) =>
  name.toLowerCase().includes(search.trim().toLowerCase());

export function AudiencePicker({
  value,
  onChange,
  groups,
  members,
}: AudiencePickerProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const labelId = useId();
  const hintId = useId();

  const choices: Choice[] = [
    ...(!value.everyone && matches(Text.everyone, search)
      ? [
          {
            kind: "everyone" as const,
            id: "everyone" as const,
            name: Text.everyone,
          },
        ]
      : []),
    ...groups
      .filter(
        (group) =>
          !value.groupIds.includes(group.id) && matches(group.name, search),
      )
      .map((group) => ({ kind: "group" as const, ...group })),
    ...members
      .filter(
        (member) =>
          !value.memberIds.includes(member.id) && matches(member.name, search),
      )
      .map((member) => ({ kind: "member" as const, ...member })),
  ].slice(0, 8);

  function pick(choice: Choice) {
    if (choice.kind === "everyone") onChange({ ...value, everyone: true });
    if (
      choice.kind === "group" &&
      value.groupIds.length < AudienceLimits.groups
    )
      onChange({ ...value, groupIds: [...value.groupIds, choice.id] });
    if (
      choice.kind === "member" &&
      value.memberIds.length < AudienceLimits.members
    )
      onChange({ ...value, memberIds: [...value.memberIds, choice.id] });
    setSearch("");
    setActive(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActive((index) => Math.min(index + 1, choices.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && isOpen && choices[active]) {
      event.preventDefault();
      pick(choices[active]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    } else if (event.key === "Backspace" && search === "") {
      if (value.memberIds.length > 0)
        onChange({ ...value, memberIds: value.memberIds.slice(0, -1) });
      else if (value.groupIds.length > 0)
        onChange({ ...value, groupIds: value.groupIds.slice(0, -1) });
      else if (value.everyone) onChange({ ...value, everyone: false });
    }
  }

  const groupName = (id: string) => groups.find((group) => group.id === id);
  const memberName = (id: string) =>
    members.find((member) => member.id === id)?.name ?? Text.someone;
  const showList = isOpen && choices.length > 0;

  return (
    <div className={styles.picker}>
      <span id={labelId} className={styles.label}>
        {Text.label}
      </span>
      <div className={styles.box}>
        {value.everyone ? (
          <span className={styles.chip} data-kind="everyone">
            <Icon name="members" className={styles.chipIcon} />
            {Text.everyone}
            <button
              type="button"
              className={styles.remove}
              aria-label={Text.remove(Text.everyone)}
              onClick={() => onChange({ ...value, everyone: false })}
            >
              <Icon name="close" />
            </button>
          </span>
        ) : null}
        {value.groupIds.map((id) => {
          const group = groupName(id);
          return (
            <span key={id} className={styles.chip} data-kind="group">
              <b>{group?.name ?? Text.oldGroup}</b>
              {group ? (
                <span className={styles.size}>· {Text.people(group.size)}</span>
              ) : null}
              <button
                type="button"
                className={styles.remove}
                aria-label={Text.remove(group?.name ?? Text.oldGroup)}
                onClick={() =>
                  onChange({
                    ...value,
                    groupIds: value.groupIds.filter((entry) => entry !== id),
                  })
                }
              >
                <Icon name="close" />
              </button>
            </span>
          );
        })}
        {value.memberIds.map((id) => (
          <span key={id} className={styles.chip} data-kind="member">
            {memberName(id)}
            <button
              type="button"
              className={styles.remove}
              aria-label={Text.remove(memberName(id))}
              onClick={() =>
                onChange({
                  ...value,
                  memberIds: value.memberIds.filter((entry) => entry !== id),
                })
              }
            >
              <Icon name="close" />
            </button>
          </span>
        ))}
        <input
          className={styles.input}
          role="combobox"
          aria-labelledby={labelId}
          aria-describedby={hintId}
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList ? `${listId}-${active}` : undefined}
          placeholder={Text.placeholder}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setIsOpen(true);
            setActive(0);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onKeyDown={handleKeyDown}
        />
        {showList ? (
          <ul
            id={listId}
            role="listbox"
            className={styles.list}
            aria-labelledby={labelId}
          >
            {choices.map((choice, index) => (
              <li
                key={`${choice.kind}-${choice.id}`}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                className={styles.option}
                data-active={index === active}
                // Picked on mouse down so the box doesn't lose focus first.
                onMouseDown={(event) => {
                  event.preventDefault();
                  pick(choice);
                }}
                onMouseEnter={() => setActive(index)}
              >
                <span className={styles.optionName}>{choice.name}</span>
                <span className={styles.optionKind}>
                  {choice.kind === "everyone"
                    ? Text.everyoneHint
                    : choice.kind === "group"
                      ? `${Text.group} · ${Text.people(choice.size)}`
                      : Text.person}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <p id={hintId} className={styles.hint}>
        {value.everyone
          ? Text.everyoneNote
          : isEmptyAudience(value)
            ? Text.nobodyNote
            : Text.someNote}
      </p>
    </div>
  );
}

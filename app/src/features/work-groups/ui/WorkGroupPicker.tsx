// File : /TeamSamsara.Workflow/app/src/features/work-groups/ui/WorkGroupPicker.tsx
// Version : 1.2.0
// Latest commit: fix/invite-and-fields
// Author : Gerrah
// Purpose : Picks work groups with one search box, like "Who's in it" on an
// event: the picked groups are chips with their size ("Bloom · 6 people"),
// and typing lists the others to add. Arrow keys, Enter and Backspace work as
// there. Used when inviting a member and on a member's page.

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/shared/icons/Icon";
import type { WorkGroupListItem } from "../types/workGroupTypes";
import { WorkGroupPickerText as Text } from "./workGroupsContent";
import styles from "./WorkGroupPicker.module.css";

interface WorkGroupPickerProps {
  groups: readonly WorkGroupListItem[];
  selectedIds: readonly string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
  /** Leave out the hint under the box. */
  hideHint?: boolean;
  /** Inside a card already titled "Work groups": the label is for screen readers only. */
  hideLegend?: boolean;
}

/** About how tall the list gets before it scrolls (see .list). */
const listRoom = 220;

const matches = (name: string, search: string) =>
  name.toLowerCase().includes(search.trim().toLowerCase());

export function WorkGroupPicker({
  groups,
  selectedIds,
  onChange,
  disabled = false,
  hideHint = false,
  hideLegend = false,
}: WorkGroupPickerProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [opensUp, setOpensUp] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const listId = useId();
  const hintId = useId();

  const picked = groups.filter((item) => selectedIds.includes(item.group.id));
  const choices = groups.filter(
    (item) =>
      !selectedIds.includes(item.group.id) && matches(item.group.name, search),
  );
  const leftToPick = groups.length - picked.length;

  /** Kept in the groups' order, so saved records read the same everywhere. */
  function change(next: readonly string[]) {
    onChange(
      groups.map((item) => item.group.id).filter((id) => next.includes(id)),
    );
  }

  /** Opens the list, upward when there's no room below (the bottom of a dialog). */
  function open() {
    const element = box.current;
    if (element && !isOpen) {
      const rect = element.getBoundingClientRect();
      const frame = element.closest("dialog")?.getBoundingClientRect();
      const bottom = Math.min(window.innerHeight, frame?.bottom ?? Infinity);
      const top = Math.max(0, frame?.top ?? 0);
      setOpensUp(
        bottom - rect.bottom < listRoom &&
          rect.top - top > bottom - rect.bottom,
      );
    }
    setIsOpen(true);
  }

  function pick(item: WorkGroupListItem) {
    change([...selectedIds, item.group.id]);
    setSearch("");
    setActive(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      open();
      setActive((index) => Math.min(index + 1, choices.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && isOpen && choices[active]) {
      event.preventDefault();
      pick(choices[active]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    } else if (event.key === "Backspace" && search === "" && picked.length) {
      change(selectedIds.filter((id) => id !== picked.at(-1)?.group.id));
    }
  }

  if (groups.length === 0) {
    return (
      <div className={styles.picker}>
        <span className={hideLegend ? styles.hiddenLabel : styles.label}>
          {Text.legend}
        </span>
        <p className={styles.hint}>{Text.none}</p>
      </div>
    );
  }

  const showList = isOpen && !disabled;

  return (
    <div className={styles.picker}>
      <label
        htmlFor={inputId}
        className={hideLegend ? styles.hiddenLabel : styles.label}
      >
        {Text.legend}
      </label>
      <div
        ref={box}
        className={styles.box}
        data-disabled={disabled || undefined}
      >
        {picked.map(({ group, members }) => (
          <span key={group.id} className={styles.chip}>
            <b className={styles.chipName}>{group.name}</b>
            {members ? (
              <span className={styles.size}>
                · {Text.people(members.length)}
              </span>
            ) : null}
            <button
              type="button"
              className={styles.remove}
              aria-label={Text.remove(group.name)}
              disabled={disabled}
              onClick={() =>
                change(selectedIds.filter((id) => id !== group.id))
              }
            >
              <Icon name="close" />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          className={styles.input}
          role="combobox"
          aria-describedby={hideHint ? undefined : hintId}
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && choices[active] ? `${listId}-${active}` : undefined
          }
          placeholder={leftToPick > 0 ? Text.placeholder : ""}
          data-full={leftToPick === 0 || undefined}
          value={search}
          disabled={disabled}
          onChange={(event) => {
            setSearch(event.target.value);
            open();
            setActive(0);
          }}
          onFocus={open}
          onBlur={() => setIsOpen(false)}
          onKeyDown={handleKeyDown}
        />
        {showList ? (
          <ul
            id={listId}
            role="listbox"
            className={styles.list}
            data-up={opensUp || undefined}
          >
            {choices.length === 0 ? (
              <li className={styles.empty}>
                {leftToPick === 0 ? Text.allPicked : Text.noMatch}
              </li>
            ) : (
              choices.map((item, index) => (
                <li
                  key={item.group.id}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  className={styles.option}
                  data-active={index === active}
                  // Picked on mouse down so the box doesn't lose focus first.
                  onMouseDown={(event) => {
                    event.preventDefault();
                    pick(item);
                  }}
                  onMouseEnter={() => setActive(index)}
                >
                  <span className={styles.optionName}>{item.group.name}</span>
                  {item.members ? (
                    <span className={styles.optionSize}>
                      {Text.people(item.members.length)}
                    </span>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
      {hideHint ? null : (
        <p id={hintId} className={styles.hint}>
          {Text.hint}
        </p>
      )}
    </div>
  );
}

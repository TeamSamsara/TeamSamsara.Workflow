// File : /TeamSamsara.Workflow/app/src/features/events/ui/EventActions.tsx
// Version : 1.0.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : An event's ⋯ menu, for planners. A one-off event: Edit, Delete.
// One date of a repeat: Edit this one, Edit this and upcoming, Skip this one,
// End the repeat, Delete this one (which skips it, so it isn't made again).

import { useState, type CSSProperties } from "react";
import { buttonLook } from "@/shared/components/Button/buttonLook";
import { Dropdown } from "@/shared/components/Dropdown/Dropdown";
import { DropdownItem } from "@/shared/components/Dropdown/DropdownItem";
import { DropdownPanel } from "@/shared/components/Dropdown/DropdownPanel";
import { DropdownTrigger } from "@/shared/components/Dropdown/DropdownTrigger";
import { Icon } from "@/shared/icons/Icon";
import type { IconName } from "@/shared/icons/iconRegistry";
import { classNames } from "@/lib/classNames";
import { occurrenceDate } from "../model/repeatRule";
import type { EventRecord } from "../types/eventTypes";
import type { RepeatRecord } from "../types/repeatTypes";
import {
  DeleteEventDialog,
  EditEventDialog,
  EditSeriesDialog,
  EndRepeatDialog,
  SkipDialog,
} from "./EventDialogs";
import { EventActionsText as Text } from "./eventActionsContent";
import styles from "./EventActions.module.css";

type Action = keyof typeof Text.actions;

/** About the height of the longest menu, to open it upward near the bottom. */
const menuHeight = 240;

/**
 * Where the menu goes on a calendar item: fixed to the window under the
 * button, since the calendar's cells and scrolling would cut it off.
 */
function fixedPlace(button: HTMLElement): CSSProperties {
  const rect = button.getBoundingClientRect();
  const right = window.innerWidth - rect.right;
  return rect.bottom + menuHeight > window.innerHeight && rect.top > menuHeight
    ? {
        position: "fixed",
        right,
        bottom: window.innerHeight - rect.top + 6,
        top: "auto",
        left: "auto",
        margin: 0,
      }
    : {
        position: "fixed",
        right,
        top: rect.bottom + 6,
        bottom: "auto",
        left: "auto",
        margin: 0,
      };
}

const icons: Record<Action, IconName> = {
  edit: "edit",
  delete: "trash",
  editOne: "edit",
  editUpcoming: "repeat",
  skip: "skip",
  end: "close",
  deleteOne: "trash",
};

interface EventActionsProps {
  event: EventRecord;
  /** The repeat it belongs to, once loaded. */
  repeat: RepeatRecord | null;
  /** item: a small button on a calendar item. header: a button beside the page's title. */
  look: "item" | "header";
  /** Called when the event is gone (deleted or skipped). */
  onGone?: () => void;
  className?: string;
}

export function EventActions({
  event,
  repeat,
  look,
  onGone,
  className,
}: EventActionsProps) {
  const [open, setOpen] = useState<Action | null>(null);
  const [place, setPlace] = useState<CSSProperties | undefined>(undefined);
  const date = repeat ? occurrenceDate(event.id, repeat.id) : null;
  const actions: Action[] =
    repeat && date
      ? ["editOne", "editUpcoming", "skip", "end", "deleteOne"]
      : ["edit", "delete"];
  const close = () => setOpen(null);

  return (
    <>
      <Dropdown className={classNames(styles.root, className)}>
        <DropdownTrigger
          popup="menu"
          aria-label={Text.menu(event.title)}
          title={Text.menu(event.title)}
          {...buttonLook(
            look === "item" ? "ghost" : "secondary",
            look === "item" ? "small" : "medium",
            false,
            styles.trigger,
          )}
          data-look={look}
          onClick={(click) => {
            if (look === "item") setPlace(fixedPlace(click.currentTarget));
          }}
          onKeyDown={(key) => {
            if (look === "item") setPlace(fixedPlace(key.currentTarget));
          }}
        >
          <Icon name="more" />
        </DropdownTrigger>
        <DropdownPanel
          role="menu"
          placement="bottom-end"
          aria-label={Text.menu(event.title)}
          style={look === "item" ? place : undefined}
        >
          {actions.map((action) => (
            <DropdownItem
              key={action}
              role="menuitem"
              onSelect={() => setOpen(action)}
              className={styles.item}
              data-danger={
                action === "delete" || action === "deleteOne" || undefined
              }
            >
              <Icon name={icons[action]} className={styles.icon} />
              {Text.actions[action]}
            </DropdownItem>
          ))}
        </DropdownPanel>
      </Dropdown>

      {open === "edit" || open === "editOne" ? (
        <EditEventDialog
          event={event}
          isOccurrence={open === "editOne"}
          onClose={close}
        />
      ) : null}
      {open === "delete" ? (
        <DeleteEventDialog event={event} onClose={close} onGone={onGone} />
      ) : null}
      {repeat && date && open === "editUpcoming" ? (
        <EditSeriesDialog repeat={repeat} fromDay={date} onClose={close} />
      ) : null}
      {repeat && date && (open === "skip" || open === "deleteOne") ? (
        <SkipDialog
          event={event}
          repeat={repeat}
          date={date}
          asDelete={open === "deleteOne"}
          onClose={close}
          onGone={onGone}
        />
      ) : null}
      {repeat && date && open === "end" ? (
        <EndRepeatDialog repeat={repeat} date={date} onClose={close} />
      ) : null}
    </>
  );
}

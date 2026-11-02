// File : /TeamSamsara.Workflow/app/src/views/events/EventSetView.tsx
// Version : 1.1.0
// Latest commit: feature/your-account
// Author : Gerrah
// Purpose : One set's page: what its events share, how far along it is
// (played, tasks done, what's next, gaps still TBD), and its events in a
// table. Planners tick events to move or delete several at once, add more
// events the same way, rename the set or delete it with its events.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { usePermissions } from "@/core/access";
import { dataErrorMessage, DataErrorText } from "@/core/data";
import { useSession } from "@/core/session";
import { useDisplayTime, useWorkspaceRecord } from "@/core/workspace";
import {
  AudienceText,
  deleteEvents,
  deleteEventSet,
  EventSetLimits,
  gapLabel,
  moveEvents,
  planGaps,
  renameEventSet,
  SetText as Text,
  useAudienceOptions,
  useEventProgress,
  useEventSet,
  useSeesAllEvents,
  useSetEvents,
  type EventRecord,
  type EventSetRecord,
} from "@/features/events";
import { useEventTypes } from "@/features/task-setup";
import { useWorkflows } from "@/features/workflows";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { buttonLook } from "@/shared/components/Button/buttonLook";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { Chip } from "@/shared/components/Chip/Chip";
import { Dropdown } from "@/shared/components/Dropdown/Dropdown";
import { DropdownItem } from "@/shared/components/Dropdown/DropdownItem";
import { DropdownPanel } from "@/shared/components/Dropdown/DropdownPanel";
import { DropdownTrigger } from "@/shared/components/Dropdown/DropdownTrigger";
import { Select } from "@/shared/components/Fields/Select/Select";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { Modal } from "@/shared/components/Modal/Modal";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { Table } from "@/shared/components/Table/Table";
import { useToast } from "@/shared/components/Toast/useToast";
import {
  eventPath,
  planSeveralPath,
  RoutePaths,
} from "@/shared/constants/routePaths";
import { useNow } from "@/shared/hooks/useNow";
import { Icon } from "@/shared/icons/Icon";
import { formatDate, formatTime } from "@/shared/time/dates";
import { addCalendarDays } from "@/shared/time/zonedTime";
import styles from "./EventViews.module.css";
import plan from "./PlanViews.module.css";

type Dialog = "rename" | "move" | "delete" | "deleteSet";

const hasGap = (title: string) => /\{[A-Za-z][A-Za-z0-9_-]*\}/.test(title);

function RenameDialog({
  set,
  onClose,
}: {
  set: EventSetRecord;
  onClose: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(set.name);
  const save = useMutation({
    mutationFn: () => renameEventSet(set.id, name),
    onSuccess: () => {
      toast.show({ tone: "success", title: Text.renameDialog.saved });
      onClose();
    },
  });
  return (
    <Modal
      title={Text.renameDialog.title}
      onClose={save.isPending ? undefined : onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
            {Text.renameDialog.cancel}
          </Button>
          <Button
            variant="primary"
            disabled={!name.trim()}
            isLoading={save.isPending}
            onClick={() => save.mutate()}
          >
            {Text.renameDialog.save}
          </Button>
        </>
      }
    >
      {save.error ? (
        <Banner tone="error">{dataErrorMessage(save.error)}</Banner>
      ) : null}
      <TextField
        label={Text.renameDialog.label}
        value={name}
        maxLength={EventSetLimits.name}
        onChange={(event) => setName(event.target.value)}
        autoFocus
      />
    </Modal>
  );
}

function MoveDialog({
  events,
  timeZone,
  onClose,
}: {
  events: readonly EventRecord[];
  timeZone: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const Words = Text.moveDialog;
  const [days, setDays] = useState("7");
  const [minutes, setMinutes] = useState("0");
  const dayCount = Math.round(Number(days) || 0);
  const minuteCount = Number(minutes);
  const isMove = dayCount !== 0 || minuteCount !== 0;
  const move = useMutation({
    // Calendar days, so a move across a clock change keeps the time of day.
    mutationFn: () =>
      moveEvents(
        events.map((event) => ({
          event,
          startsAt: new Date(
            addCalendarDays(event.startsAt, dayCount, timeZone).getTime() +
              minuteCount * 60_000,
          ),
        })),
      ),
    onSuccess: () => {
      toast.show({ tone: "success", title: Words.moved(events.length) });
      onClose();
    },
  });
  return (
    <Modal
      title={Words.title(events.length)}
      description={Words.description}
      onClose={move.isPending ? undefined : onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={move.isPending}>
            {Words.cancel}
          </Button>
          <Button
            variant="primary"
            disabled={!isMove}
            isLoading={move.isPending}
            onClick={() => move.mutate()}
          >
            {Words.move}
          </Button>
        </>
      }
    >
      {move.error ? (
        <Banner tone="error">{dataErrorMessage(move.error)}</Banner>
      ) : null}
      <div className={plan.moveFields}>
        <TextField
          label={Words.days}
          help={Words.daysHelp}
          type="number"
          inputMode="numeric"
          min={-365}
          max={365}
          value={days}
          onChange={(event) => setDays(event.target.value)}
          autoFocus
        />
        <Select
          label={Words.minutes}
          options={Object.keys(Words.shift)
            .sort((a, b) => Number(a) - Number(b))
            .map((value) => ({ value, label: Words.shift[value] }))}
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
        />
      </div>
      {!isMove ? <p className={plan.note}>{Words.noMove}</p> : null}
    </Modal>
  );
}

function DeleteDialog({
  set,
  eventIds,
  wholeSet,
  onClose,
  onGone,
}: {
  set: EventSetRecord;
  eventIds: readonly string[];
  wholeSet: boolean;
  onClose: () => void;
  onGone: () => void;
}) {
  const toast = useToast();
  const Words = wholeSet ? Text.deleteSetDialog : Text.deleteDialog;
  const remove = useMutation({
    mutationFn: () =>
      wholeSet ? deleteEventSet(set.id, eventIds) : deleteEvents(eventIds),
    onSuccess: () => {
      toast.show({
        tone: "success",
        title: wholeSet
          ? Text.deleteSetDialog.deleted(set.name)
          : Text.deleteDialog.deleted(eventIds.length),
      });
      onGone();
    },
  });
  return (
    <Modal
      title={
        wholeSet
          ? Text.deleteSetDialog.title(set.name)
          : Text.deleteDialog.title(eventIds.length)
      }
      onClose={remove.isPending ? undefined : onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={remove.isPending}>
            {Words.cancel}
          </Button>
          <Button
            variant="danger"
            iconStart="trash"
            isLoading={remove.isPending}
            onClick={() => remove.mutate()}
          >
            {Words.confirm}
          </Button>
        </>
      }
    >
      {remove.error ? (
        <Banner tone="error">{dataErrorMessage(remove.error)}</Banner>
      ) : null}
      <p className={plan.dialogText}>{Words.body(eventIds.length)}</p>
    </Modal>
  );
}

function SetPage({ set }: { set: EventSetRecord }) {
  const access = usePermissions();
  const session = useSession();
  const member = session.status === "active" ? session.member : null;
  const workspace = useWorkspaceRecord();
  const time = useDisplayTime();
  const eventTypes = useEventTypes();
  const workflows = useWorkflows();
  const people = useAudienceOptions();
  const seesAll = useSeesAllEvents();
  const navigate = useNavigate();
  const now = useNow();
  const events = useSetEvents(set.id, member);
  const progress = useEventProgress(events.items.map((event) => event.id));
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [dialog, setDialog] = useState<Dialog | null>(null);

  const tz = time.timeZone;
  const canPlan = access.can("planEvents");
  const type = eventTypes.items.find((entry) => entry.id === set.eventTypeId);
  const gaps = planGaps(set.titlePattern, []);
  const audience = [
    ...(set.everyone ? [AudienceText.everyone] : []),
    ...set.groupIds.map(
      (id) => people.groups.find((group) => group.id === id)?.name ?? "",
    ),
    ...set.memberIds.map(
      (id) => people.members.find((entry) => entry.id === id)?.name ?? "",
    ),
  ].filter(Boolean);
  const workflowNames = workflows.items
    .filter((workflow) => set.workflowIds.includes(workflow.id))
    .map((workflow) => workflow.name);

  const items = events.items;
  // Ticked events that still exist (one may have been deleted elsewhere).
  const selected = items.filter((event) => picked.has(event.id));
  const played = items.filter((event) => event.endsAt <= now).length;
  const next = items.find((event) => event.startsAt > now);
  const tbd = items.filter((event) => hasGap(event.title)).length;
  let tasksDone = 0;
  let tasksTotal = 0;
  for (const entry of progress.values()) {
    tasksDone += entry.done;
    tasksTotal += entry.total;
  }
  const day = (date: Date) => formatDate(date, tz, time.dateFormat);
  const span =
    items.length > 0
      ? Text.dates(
          day(items[0].startsAt),
          day(items[items.length - 1].startsAt),
        )
      : null;

  function toggle(id: string) {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  }

  const allPicked = items.length > 0 && selected.length === items.length;

  return (
    <>
      <PageHeader
        title={set.name}
        breadcrumbs={[
          { label: Text.calendar, to: RoutePaths.calendar },
          { label: Text.sets, to: RoutePaths.eventSets },
          { label: set.name },
        ]}
        description={
          <span className={plan.meta}>
            {type ? <Chip label={type.name} color={type.color} /> : null}
            <span>
              {Text.events(items.length)}
              {span ? ` · ${span}` : ""}
            </span>
            {audience.length > 0 ? <span>{audience.join(", ")}</span> : null}
            <span>
              {workflowNames.length > 0
                ? workflowNames.join(", ")
                : Text.workflowsNone}
            </span>
          </span>
        }
        actions={
          canPlan ? (
            <>
              <Dropdown>
                <DropdownTrigger
                  popup="menu"
                  aria-label={Text.more(set.name)}
                  title={Text.more(set.name)}
                  {...buttonLook(
                    "secondary",
                    "medium",
                    false,
                    plan.moreTrigger,
                  )}
                >
                  <Icon name="more" />
                </DropdownTrigger>
                <DropdownPanel
                  role="menu"
                  placement="bottom-end"
                  aria-label={Text.more(set.name)}
                >
                  <DropdownItem
                    role="menuitem"
                    className={plan.menuItem}
                    onSelect={() => setDialog("rename")}
                  >
                    <Icon name="edit" className={plan.menuIcon} />
                    {Text.rename}
                  </DropdownItem>
                  <DropdownItem
                    role="menuitem"
                    className={plan.menuItem}
                    data-danger
                    onSelect={() => setDialog("deleteSet")}
                  >
                    <Icon name="trash" className={plan.menuIcon} />
                    {Text.deleteSet}
                  </DropdownItem>
                </DropdownPanel>
              </Dropdown>
              <LinkButton
                to={planSeveralPath(set.id)}
                variant="primary"
                iconStart="add"
              >
                {Text.addEvents}
              </LinkButton>
            </>
          ) : null
        }
      />

      {!seesAll ? <Banner tone="info">{Text.limited}</Banner> : null}
      {events.status === "error" ? (
        <Banner tone="error">{DataErrorText[events.error ?? "unknown"]}</Banner>
      ) : null}

      <div className={plan.stats}>
        <div className={plan.stat}>
          <b>
            {played} / {items.length}
          </b>
          {Text.played}
        </div>
        <div className={plan.stat}>
          <b>
            {tasksDone} / {tasksTotal}
          </b>
          {Text.tasksDone}
        </div>
        <div className={plan.stat}>
          <b>{next ? day(next.startsAt) : Text.allPast}</b>
          {next ? Text.next(next.title) : Text.nothingNext}
        </div>
        <div className={plan.stat} data-tone={tbd > 0 ? "alert" : undefined}>
          <b>{tbd}</b>
          {tbd > 0 ? Text.tbd(tbd) : Text.noneTbd}
        </div>
      </div>

      {canPlan && selected.length > 0 ? (
        <div className={plan.selectionBar}>
          <span>{Text.selected(selected.length)}</span>
          <Button iconStart="time" onClick={() => setDialog("move")}>
            {Text.moveSeveral}
          </Button>
          <Button
            variant="danger"
            iconStart="trash"
            onClick={() => setDialog("delete")}
          >
            {Text.deleteSeveral}
          </Button>
        </div>
      ) : null}

      {events.status === "loading" ? (
        <div className={styles.loading}>
          <Spinner label={Text.loading} />
        </div>
      ) : items.length === 0 ? (
        <p className={plan.empty}>{Text.noEvents}</p>
      ) : (
        <div className={plan.tableCard}>
          <Table
            caption={Text.eventsCaption}
            minWidth={620 + gaps.length * 120}
          >
            <thead>
              <tr>
                {canPlan ? (
                  <th>
                    <input
                      type="checkbox"
                      className={plan.check}
                      aria-label={Text.selectAll}
                      checked={allPicked}
                      onChange={() =>
                        setPicked(
                          allPicked
                            ? new Set()
                            : new Set(items.map((event) => event.id)),
                        )
                      }
                    />
                  </th>
                ) : null}
                <th>{Text.when}</th>
                <th>{Text.event}</th>
                {gaps.map((gap) => (
                  <th key={gap}>{gapLabel(gap)}</th>
                ))}
                <th>{Text.tasks}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((event) => {
                const entry = progress.get(event.id);
                const isPast = event.endsAt <= now;
                return (
                  <tr
                    key={event.id}
                    className={
                      isPast
                        ? plan.past
                        : event === next
                          ? plan.next
                          : undefined
                    }
                  >
                    {canPlan ? (
                      <td>
                        <input
                          type="checkbox"
                          className={plan.check}
                          aria-label={Text.select(event.title)}
                          checked={picked.has(event.id)}
                          onChange={() => toggle(event.id)}
                        />
                      </td>
                    ) : null}
                    <td className={plan.muted}>
                      {day(event.startsAt)} ·{" "}
                      {formatTime(event.startsAt, tz, time.timeFormat)}
                    </td>
                    <td>
                      <Link to={eventPath(event.id)} className={plan.eventLink}>
                        {event.title}
                      </Link>
                    </td>
                    {gaps.map((gap) => (
                      <td key={gap}>
                        {event.details[gap] ? (
                          event.details[gap]
                        ) : (
                          <span className={plan.pill}>{Text.tbdPill}</span>
                        )}
                      </td>
                    ))}
                    <td
                      className={
                        entry && entry.total > 0 && entry.done === entry.total
                          ? plan.done
                          : plan.muted
                      }
                    >
                      {Text.progress(entry?.done ?? 0, entry?.total ?? 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}
      {canPlan && items.length > 0 ? (
        <p className={plan.note}>{Text.tickHelp}</p>
      ) : null}

      {dialog === "rename" ? (
        <RenameDialog set={set} onClose={() => setDialog(null)} />
      ) : null}
      {dialog === "move" ? (
        <MoveDialog
          events={selected}
          timeZone={workspace.timeZone}
          onClose={() => {
            setDialog(null);
            setPicked(new Set());
          }}
        />
      ) : null}
      {dialog === "delete" || dialog === "deleteSet" ? (
        <DeleteDialog
          set={set}
          eventIds={(dialog === "delete" ? selected : items).map(
            (event) => event.id,
          )}
          wholeSet={dialog === "deleteSet"}
          onClose={() => setDialog(null)}
          onGone={() => {
            setDialog(null);
            setPicked(new Set());
            if (dialog === "deleteSet")
              navigate(RoutePaths.eventSets, { replace: true });
          }}
        />
      ) : null}
    </>
  );
}

export function EventSetView() {
  const { setId } = useParams();
  const set = useEventSet(setId);

  return (
    <div className={styles.page}>
      {set === undefined ? (
        <div className={styles.loading}>
          <Spinner label={Text.loading} />
        </div>
      ) : set === null ? (
        <div className={styles.missing}>
          <Banner tone="info">{Text.notFound}</Banner>
          <LinkButton
            to={RoutePaths.eventSets}
            iconStart="back"
            variant="ghost"
          >
            {Text.sets}
          </LinkButton>
        </div>
      ) : (
        <SetPage key={set.id} set={set} />
      )}
    </div>
  );
}

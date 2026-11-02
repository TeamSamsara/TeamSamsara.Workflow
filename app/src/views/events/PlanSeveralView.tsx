// File : /TeamSamsara.Workflow/app/src/views/events/PlanSeveralView.tsx
// Version : 1.1.0
// Latest commit: feature/your-account
// Author : Gerrah
// Purpose : Planning several events at once, as a set: what they share (the
// set's name, type, usual times, a title with {gaps}, who's in them), then
// one row per event, filled by a weekly pattern, pasted from a spreadsheet or
// typed. The side says what it will make and which workflows give each event
// its tasks. ?set=<id> adds more events to a set, starting from what its
// events were made with.

import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  Navigate,
  useBlocker,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { usePermissions } from "@/core/access";
import { dataErrorMessage } from "@/core/data";
import { useSession } from "@/core/session";
import {
  PlannedZoneNote,
  useDisplayTime,
  useWorkspaceRecord,
} from "@/core/workspace";
import { useWhoCanMake } from "@/features/availability";
import {
  addToEventSet,
  askedGaps,
  AudiencePicker,
  AudienceText,
  checkPlan,
  createEventSet,
  emptyGaps,
  emptyPlan,
  EventLimits,
  nextRow,
  PasteDialog,
  PatternDialog,
  planForSet,
  planGaps,
  planMinutes,
  PlanTable,
  PlanText as Text,
  rowFields,
  sortRows,
  useAudienceOptions,
  useEventSet,
  WorkflowPicker,
  type EventFields,
  type EventSetRecord,
  type PlanDraft,
  type PlanRow,
} from "@/features/events";
import {
  startingStatus,
  useEventTypes,
  useStatuses,
} from "@/features/task-setup";
import { useWorkGroups } from "@/features/work-groups";
import { useWorkflows } from "@/features/workflows";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { Select } from "@/shared/components/Fields/Select/Select";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { Modal } from "@/shared/components/Modal/Modal";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { useToast } from "@/shared/components/Toast/useToast";
import { eventSetPath, RoutePaths } from "@/shared/constants/routePaths";
import { useNow } from "@/shared/hooks/useNow";
import { dayKey } from "@/shared/time/dates";
import { addDayKeys } from "@/shared/time/weekGrid";
import styles from "./EventViews.module.css";
import plan from "./PlanViews.module.css";

function PlanSeveral({ set }: { set: EventSetRecord | null }) {
  const access = usePermissions();
  const session = useSession();
  const member = session.status === "active" ? session.member : null;
  const workspace = useWorkspaceRecord();
  const time = useDisplayTime();
  const statuses = useStatuses();
  const eventTypes = useEventTypes();
  const groups = useWorkGroups();
  const workflows = useWorkflows();
  const people = useAudienceOptions();
  const toast = useToast();
  const navigate = useNavigate();
  const now = useNow();
  const tz = workspace.timeZone;
  const [draft, setDraft] = useState<PlanDraft>(() =>
    set ? planForSet(set) : emptyPlan(),
  );
  const [pickedIds, setPickedIds] = useState<string[] | null>(
    () => set?.workflowIds ?? null,
  );
  const [dialog, setDialog] = useState<"pattern" | "paste" | null>(null);
  const [tried, setTried] = useState(false);
  const leaving = useRef(false);

  const available = workflows.items.filter((workflow) => !workflow.archived);
  // Until the planner picks, the workflows made for this type are ticked.
  const selectedIds =
    pickedIds ??
    (draft.eventTypeId
      ? available
          .filter((workflow) => workflow.eventTypeId === draft.eventTypeId)
          .map((workflow) => workflow.id)
      : []);
  const selected = available.filter((workflow) =>
    selectedIds.includes(workflow.id),
  );
  const gaps = planGaps(draft.titlePattern, askedGaps(selected));
  const problems = checkPlan(draft, tz);
  const startId = startingStatus(statuses.items)?.id ?? null;
  const tasksEach = selected.reduce(
    (count, workflow) => count + workflow.steps.length,
    0,
  );
  const events = draft.rows
    .map((row) => rowFields(draft, row, tz))
    .filter((fields): fields is EventFields => fields !== null);
  const today = dayKey(now, tz);

  // Who's in them, as people: everyone in their groups and the people added.
  const inIt = draft.audience.everyone
    ? []
    : [
        ...new Set([
          ...draft.audience.groupIds.flatMap(
            (id) =>
              people.groups.find((group) => group.id === id)?.memberIds ?? [],
          ),
          ...draft.audience.memberIds,
        ]),
      ]
        .map((id) => people.members.find((entry) => entry.id === id))
        .filter((entry): entry is { id: string; name: string } =>
          Boolean(entry),
        );
  const spans = draft.rows.flatMap((row) => {
    const fields = rowFields(draft, row, tz);
    return fields
      ? [{ key: row.key, start: fields.startsAt, end: fields.endsAt }]
      : [];
  });
  const who = useWhoCanMake(inIt, spans, tz);
  const busyRows = [...who.values()].filter(
    (check) => check.free < check.total,
  ).length;
  const tbdRows = draft.rows.filter(
    (row) => emptyGaps(row, gaps).length > 0,
  ).length;

  function change(changes: Partial<PlanDraft>) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  function addRows(rows: PlanRow[]) {
    setDraft((current) => ({
      ...current,
      rows: sortRows([...current.rows, ...rows]),
    }));
    setDialog(null);
  }

  const create = useMutation({
    mutationFn: async () => {
      if (!member) throw new Error("Not signed in");
      const options = {
        workflows: selected,
        formats: {
          timeZone: tz,
          clock: workspace.timeFormat,
          dateFormat: workspace.dateFormat,
        },
        startingStatusId: startId ?? "",
        createdBy: member.id,
      };
      if (set) {
        await addToEventSet(set.id, events, options);
        return set.id;
      }
      return createEventSet(
        {
          name: draft.name,
          eventTypeId: draft.eventTypeId,
          titlePattern: draft.titlePattern,
          minutes: planMinutes(draft),
          ...draft.audience,
        },
        events,
        options,
      );
    },
    onSuccess: (setId) => {
      toast.show({
        tone: "success",
        title: Text.created(events.length, set?.name ?? draft.name.trim()),
      });
      leaving.current = true;
      navigate(eventSetPath(setId), { replace: true });
    },
  });

  const hasInput = draft.rows.length > 0 || draft.titlePattern.trim() !== "";
  const blocker = useBlocker(
    () => !leaving.current && hasInput && !create.isPending,
  );

  if (!access.can("planEvents"))
    return <Navigate to={RoutePaths.calendar} replace />;

  function submit() {
    setTried(true);
    if (problems.count > 0 || (tasksEach > 0 && !startId)) return;
    create.mutate();
  }

  const lastDate = draft.rows.findLast((row) => row.date)?.date;
  const workflowNames = selected.map((workflow) => workflow.name).join(", ");

  return (
    <div className={styles.page}>
      <PageHeader
        title={set ? Text.pageFor(set.name) : Text.page}
        description={set ? Text.introAdd : Text.intro}
        breadcrumbs={[
          { label: Text.calendar, to: RoutePaths.calendar },
          ...(set
            ? [
                { label: Text.sets, to: RoutePaths.eventSets },
                { label: set.name, to: eventSetPath(set.id) },
              ]
            : []),
          { label: Text.page },
        ]}
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() =>
                navigate(set ? eventSetPath(set.id) : RoutePaths.calendar)
              }
              disabled={create.isPending}
            >
              {Text.cancel}
            </Button>
            <Button
              variant="primary"
              iconStart="add"
              onClick={submit}
              isLoading={create.isPending}
            >
              {events.length > 0
                ? Text.create(events.length, events.length * tasksEach)
                : Text.createPlain}
            </Button>
          </>
        }
      />
      {tried && problems.count > 0 ? (
        <Banner tone="error">{Text.problems}</Banner>
      ) : null}
      {tasksEach > 0 && !startId ? (
        <Banner tone="alert">{Text.noStatuses}</Banner>
      ) : null}
      {create.error ? (
        <Banner tone="error">
          {Text.failed}: {dataErrorMessage(create.error)}
        </Banner>
      ) : null}

      <div className={styles.columns}>
        <div className={styles.main}>
          <section className={plan.card} aria-labelledby="plan-shared">
            <h2 id="plan-shared" className={plan.cardTitle}>
              {Text.shared}
            </h2>
            <div className={plan.fieldRow}>
              {set ? null : (
                <TextField
                  label={Text.name}
                  help={Text.nameHelp}
                  placeholder={Text.namePlaceholder}
                  value={draft.name}
                  maxLength={80}
                  onChange={(event) => change({ name: event.target.value })}
                  error={tried ? problems.name : undefined}
                  className={plan.name}
                  autoFocus
                />
              )}
              <Select
                label={Text.type}
                options={[
                  { value: "", label: Text.noType },
                  ...eventTypes.items.map((type) => ({
                    value: type.id,
                    label: type.name,
                  })),
                ]}
                value={draft.eventTypeId ?? ""}
                onChange={(event) =>
                  change({ eventTypeId: event.target.value || null })
                }
                className={plan.type}
              />
            </div>
            <div className={plan.fieldRow}>
              <TextField
                label={Text.title}
                help={Text.titleHelp}
                placeholder={Text.titlePlaceholder}
                value={draft.titlePattern}
                maxLength={EventLimits.title}
                onChange={(event) =>
                  change({ titlePattern: event.target.value })
                }
                error={tried ? problems.title : undefined}
                className={plan.title}
              />
              <TextField
                label={Text.usualStart}
                type="time"
                value={draft.time}
                onChange={(event) =>
                  event.target.value && change({ time: event.target.value })
                }
                className={plan.time}
              />
              <TextField
                label={Text.usualEnd}
                type="time"
                value={draft.endTime}
                onChange={(event) =>
                  event.target.value && change({ endTime: event.target.value })
                }
                className={plan.time}
              />
            </div>
            <PlannedZoneNote />
            <AudiencePicker
              value={draft.audience}
              onChange={(audience) => change({ audience })}
              groups={people.groups}
              members={people.members}
            />
          </section>
        </div>

        <aside className={styles.side}>
          <section className={plan.summary} aria-labelledby="plan-summary">
            <h2 id="plan-summary" className={plan.summaryTitle}>
              {Text.summaryTitle}
            </h2>
            <div className={plan.counts}>
              <span>
                <b>{events.length}</b>
                {Text.events}
              </span>
              <span>
                <b>{events.length * tasksEach}</b>
                {Text.tasks}
              </span>
            </div>
            <span className={plan.summaryHelp}>
              {Text.summaryHelp(workflowNames)}
            </span>
            {busyRows > 0 ? (
              <span className={plan.summaryWarn}>
                {Text.busyRows(busyRows)}
              </span>
            ) : null}
            {tried && problems.byRow.size > 0 ? (
              <span className={plan.summaryWarn}>
                {Text.rowsToFix(problems.byRow.size)}
              </span>
            ) : null}
          </section>
          <WorkflowPicker
            workflows={available}
            selectedIds={selectedIds}
            onChange={setPickedIds}
            eventTypeId={draft.eventTypeId}
            groups={groups.items.map((item) => item.group)}
          />
        </aside>
      </div>

      <section className={plan.card} aria-labelledby="plan-rows">
        <div className={plan.rowsHead}>
          <h2 id="plan-rows" className={plan.cardTitle}>
            {Text.rowsTitle}
          </h2>
          <Button iconStart="repeat" onClick={() => setDialog("pattern")}>
            {Text.addPattern}
          </Button>
          <Button iconStart="paste" onClick={() => setDialog("paste")}>
            {Text.paste}
          </Button>
          <Button
            variant="ghost"
            iconStart="add"
            onClick={() => change({ rows: [...draft.rows, nextRow(draft)] })}
          >
            {Text.addRow}
          </Button>
        </div>
        {draft.rows.length === 0 ? (
          <p
            className={plan.empty}
            data-invalid={tried && problems.rows ? true : undefined}
          >
            {Text.empty}
          </p>
        ) : (
          <PlanTable
            rows={draft.rows}
            gaps={gaps}
            titlePattern={draft.titlePattern}
            problems={tried ? problems.byRow : null}
            who={inIt.length > 0 ? who : null}
            whoNote={
              draft.audience.everyone ? AudienceText.everyone : Text.whoNobody
            }
            onChange={(rows) => change({ rows })}
          />
        )}
        {tried && problems.rows && draft.rows.length > 0 ? (
          <p className={plan.error}>{problems.rows}</p>
        ) : null}
        {tbdRows > 0 ? (
          <p className={plan.note}>{Text.tbdNote(tbdRows)}</p>
        ) : null}
      </section>

      {dialog === "pattern" ? (
        <PatternDialog
          from={lastDate ? addDayKeys(lastDate, 7) : today}
          time={draft.time}
          endTime={draft.endTime}
          weekStartsOn={workspace.weekStartsOn}
          onAdd={addRows}
          onClose={() => setDialog(null)}
        />
      ) : dialog === "paste" ? (
        <PasteDialog
          gaps={gaps}
          usual={{ time: draft.time, endTime: draft.endTime }}
          options={{ today, dayFirst: time.dateFormat === "dayMonth" }}
          timeZone={tz}
          onAdd={addRows}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {blocker.state === "blocked" ? (
        <Modal
          title={Text.discard.title}
          onClose={() => blocker.reset()}
          footer={
            <>
              <Button onClick={() => blocker.reset()}>
                {Text.discard.keep}
              </Button>
              <Button variant="danger" onClick={() => blocker.proceed()}>
                {Text.discard.confirm}
              </Button>
            </>
          }
        >
          <p className={styles.text}>{Text.discard.body}</p>
        </Modal>
      ) : null}
    </div>
  );
}

export function PlanSeveralView() {
  const [params] = useSearchParams();
  const setId = params.get("set");
  const set = useEventSet(setId);

  if (setId && set === undefined)
    return (
      <div className={styles.loading}>
        <Spinner label={Text.page} />
      </div>
    );
  if (setId && set === null)
    return (
      <div className={styles.missing}>
        <Banner tone="info">{Text.notFound}</Banner>
        <LinkButton to={RoutePaths.calendar} iconStart="back" variant="ghost">
          {Text.calendar}
        </LinkButton>
      </div>
    );
  return <PlanSeveral key={set?.id ?? "new"} set={set ?? null} />;
}

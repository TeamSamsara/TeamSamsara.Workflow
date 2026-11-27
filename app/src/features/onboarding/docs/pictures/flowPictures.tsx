// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/pictures/flowPictures.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-docs-seed
// Author : Gerrah
// Purpose : Pictures for the 1.2 help on seeing and changing a workflow's
// order: the Flow view, Preview on a date, and the list after saving.

import type { CSSProperties, ReactNode } from "react";
import {
  Chip,
  FakeButton,
  Field,
  Panel,
  Row,
  Scene,
  Segments,
  Small,
  Spot,
  Text,
} from "./kit";

const line: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const columns: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr auto 1fr",
  alignItems: "center",
  gap: 8,
};

const box = (dashed = false): CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  gap: 2,
  padding: "8px 10px",
  border: `1px ${dashed ? "dashed" : "solid"} var(--color-border-control)`,
  borderRadius: 8,
  background: "var(--color-surface)",
});

function Box({
  title,
  sub,
  badge,
  dashed,
}: {
  title: string;
  sub: string;
  badge?: ReactNode;
  dashed?: boolean;
}) {
  return (
    <span style={box(dashed)}>
      <span style={{ ...line, justifyContent: "space-between" }}>
        <b style={{ fontSize: 12 }}>{title}</b>
        {badge}
      </span>
      <Small>{sub}</Small>
    </span>
  );
}

/** A link between boxes: solid when something has to happen first, dashed when only the order. */
const Link = ({ soft }: { soft?: boolean }) => (
  <span
    style={{
      width: 28,
      borderTop: `2px ${soft ? "dashed var(--color-text-muted)" : "solid var(--color-accent)"}`,
    }}
  />
);

export function FlowView() {
  return (
    <Scene>
      <span style={{ ...line, justifyContent: "space-between" }}>
        <Spot n={1}>
          <Segments items={["List", "Flow"]} on={1} />
        </Spot>
        <FakeButton>Preview on a date</FakeButton>
      </span>
      <Panel>
        <Row>
          <span style={{ ...columns, width: "100%" }}>
            <Small>2 days before, 3 PM</Small>
            <span />
            <Small>The day before, 5 PM</Small>
            <span />
            <Spot n={2}>
              <Small>
                <b>Event starts</b> · The day after
              </Small>
            </Spot>
            <Box title="1. Print the flyers" sub="Design · Needs approval" />
            <Spot n={3}>
              <Link />
            </Spot>
            <Box title="2. Announcement post" sub="Marketing" />
            <Link soft />
            <Spot n={4}>
              <Box title="3. Share the recap" sub="Sam Rivera" />
            </Spot>
          </span>
        </Row>
      </Panel>
    </Scene>
  );
}

export function PreviewOnDate() {
  return (
    <Scene>
      <Panel title="Preview on a date" pop>
        <Row>
          <Spot n={1}>
            <Field>Event starts on Dec 4 · 7:00 PM</Field>
          </Spot>
        </Row>
        <Row>
          <Spot n={2}>
            <Small>
              <b>Print the flyers</b> would already be late.
            </Small>
          </Spot>
        </Row>
        <Row>
          <span style={{ ...columns, width: "100%" }}>
            <Spot n={3}>
              <Box
                title="Print the flyers"
                sub="Someone in Design"
                badge={<Chip tone="info">Limited</Chip>}
              />
            </Spot>
            <Link />
            <Box
              title="Announcement post"
              sub="Someone in Marketing"
              badge={<Chip tone="accent">Available</Chip>}
              dashed
            />
            <Link soft />
            <Box title="Share the recap" sub="Sam Rivera" dashed />
          </span>
        </Row>
      </Panel>
    </Scene>
  );
}

export function AfterSaving() {
  return (
    <Scene>
      <Panel title="2 tasks are due at a different time than their step" pop>
        <Row>
          <Small>Saving never moves anyone&apos;s tasks.</Small>
        </Row>
        <Row>
          <Text title="Launch banner" sub="Product launch · Fri, Nov 20" />
          <Spot n={1}>
            <span style={{ display: "flex", flexDirection: "column" }}>
              <Small>Due Wed, 3:00 PM</Small>
              <Small>
                <b>The step says Wed, 5:00 PM</b>
              </Small>
            </span>
          </Spot>
          <Spot n={2}>
            <FakeButton>Move</FakeButton>
          </Spot>
        </Row>
        <Row style={{ justifyContent: "flex-end" }}>
          <Spot n={3}>
            <span style={line}>
              <FakeButton>Leave them</FakeButton>
              <FakeButton primary>Move both</FakeButton>
            </span>
          </Spot>
        </Row>
      </Panel>
    </Scene>
  );
}

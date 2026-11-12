// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/pictures/setPictures.tsx
// Version : 1.0.1
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Pictures for the Sets article: a set's page with what to click,
// filling in a TBD step by step, and a task before and after.

import {
  Arrow,
  Chip,
  FakeButton,
  Field,
  Heading,
  Panel,
  Row,
  Scene,
  Small,
  Spot,
  Text,
} from "./kit";

const columns = {
  display: "grid",
  gridTemplateColumns: "50px minmax(0, 1.4fr) minmax(0, 1fr)",
  gap: 8,
  alignItems: "center",
  width: "100%",
} as const;

export function SetPage() {
  return (
    <Scene height={200}>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Heading>Autumn workshops</Heading>
        <span style={{ marginLeft: "auto" }}>
          <Spot n={2}>
            <FakeButton>⋯</FakeButton>
          </Spot>
        </span>
      </span>
      <Panel>
        <Row>
          <span style={columns}>
            <Small>Date</Small>
            <Small>Event</Small>
            <Small>Speaker</Small>
          </span>
        </Row>
        <Row>
          <span style={columns}>
            <span>Nov 12</span>
            <span>Workshop: Dana Reyes</span>
            <span>Dana Reyes</span>
          </span>
        </Row>
        <Row>
          <span style={columns}>
            <span>Nov 19</span>
            <span>
              <Spot n={3}>Workshop: {"{speaker}"}</Spot>
            </span>
            <span>
              <Spot n={1}>
                <Chip tone="warn">TBD</Chip>
              </Spot>
            </span>
          </span>
        </Row>
        <Row>
          <span style={columns}>
            <span>Nov 26</span>
            <span>Workshop: {"{speaker}"}</span>
            <span>
              <Chip tone="warn">TBD</Chip>
            </span>
          </span>
        </Row>
      </Panel>
    </Scene>
  );
}

export function FillClick() {
  return (
    <Scene height={140} style={{ justifyContent: "center" }}>
      <Panel>
        <Row>
          <Text title="Thu Nov 19" sub="Workshop: {speaker}" />
          <Spot n={0}>
            <Chip tone="warn">TBD</Chip>
          </Spot>
        </Row>
      </Panel>
      <Arrow>↖ click</Arrow>
    </Scene>
  );
}

export function FillType() {
  return (
    <Scene height={140} style={{ justifyContent: "center" }}>
      <Panel pop title="Speaker">
        <Row>
          <Field>Lee Park</Field>
          <span style={{ marginLeft: "auto" }}>
            <FakeButton primary>Save</FakeButton>
          </span>
        </Row>
      </Panel>
    </Scene>
  );
}

export function FillDone() {
  return (
    <Scene height={140} style={{ justifyContent: "center" }}>
      <Panel>
        <Row>
          <Text title="Workshop: Lee Park" sub="Thu Nov 19" />
        </Row>
        <Row>
          <Text title="Announcement for Lee Park" sub="Its task" />
        </Row>
      </Panel>
      <Chip tone="accent">✓ 4 tasks updated</Chip>
    </Scene>
  );
}

export function TaskBeforeFill() {
  return (
    <Scene height={130}>
      <Panel>
        <Row>
          <Text
            title={
              <>
                Announcement for <Chip tone="warn">[Speaker]</Chip>
              </>
            }
            sub="From the workflow"
          />
        </Row>
        <Row>
          <Text title="Doors open at 5:30!" sub="Notes Sam wrote" />
        </Row>
      </Panel>
    </Scene>
  );
}

export function TaskAfterFill() {
  return (
    <Scene height={130}>
      <Panel>
        <Row glow>
          <Text title="Announcement for Lee Park" sub="Filled in" />
        </Row>
        <Row>
          <Text title="Doors open at 5:30!" sub="Notes Sam wrote · kept" />
        </Row>
      </Panel>
    </Scene>
  );
}

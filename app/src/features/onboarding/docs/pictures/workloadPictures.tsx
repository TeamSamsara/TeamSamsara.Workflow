// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/pictures/workloadPictures.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-wording-help
// Author : Gerrah
// Purpose : Pictures for the 1.2 help articles: your week in a word, a task
// waiting on others, a step's order rules, giving a task past someone's
// capacity, a task meant for someone, and viewing as a role.

import type { CSSProperties } from "react";
import {
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

const line: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const stack: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

export function YourWeek() {
  return (
    <Scene>
      <span
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 12,
        }}
      >
        <Panel title="Your week">
          <Row>
            <Text title="Nov 16 – 22" sub="2 tasks, one of them a bigger one" />
            <Spot n={1}>
              <Chip tone="info">Limited</Chip>
            </Spot>
          </Row>
          <Row>
            <Small>
              Your usual week is set by your Owners and Administrators.
            </Small>
          </Row>
        </Panel>
        <Panel title="Waiting for someone">
          <Row>
            <Text title="Launch banner" sub="A bigger task" />
            <Spot n={2}>
              <span style={stack}>
                <Small>Too big for your week</Small>
                <FakeButton>Claim</FakeButton>
              </span>
            </Spot>
          </Row>
          <Row>
            <Text title="Thank-you note" sub="A quick task" />
            <FakeButton primary>Claim</FakeButton>
          </Row>
        </Panel>
      </span>
      <span style={line}>
        <Spot n={3}>
          <span style={line}>
            <Chip tone="accent">Available</Chip>
            <Chip tone="info">Limited</Chip>
            <Chip tone="warn">At capacity</Chip>
            <Chip tone="alert">Over capacity</Chip>
          </span>
        </Spot>
      </span>
    </Scene>
  );
}

export function WaitingTask() {
  return (
    <Scene>
      <span
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 12,
        }}
      >
        <Panel title="Waiting on others">
          <Spot n={1}>
            <Row>
              <Text
                title="Announcement post"
                sub="🔒 Waiting for Launch banner"
              />
              <Chip tone="neutral">To do</Chip>
            </Row>
          </Spot>
        </Panel>
        <Panel title="Order">
          <Row>
            <span style={stack}>
              <Small>
                <b>Locked.</b> Waiting for Launch banner to be approved.
              </Small>
              <Spot n={2}>
                <FakeButton>Start anyway</FakeButton>
              </Spot>
            </span>
          </Row>
          <Spot n={3}>
            <span style={stack}>
              <Row>
                <Text
                  title="Launch banner"
                  sub="Comes after · has to be approved first"
                />
              </Row>
              <Row>
                <Text
                  title="Share the recap"
                  sub="Comes before · waits for this to be done"
                />
              </Row>
            </span>
          </Spot>
        </Panel>
      </span>
    </Scene>
  );
}

export function OrderRules() {
  return (
    <Scene>
      <Heading>4 · Order</Heading>
      <span
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr 1.3fr",
          gap: 8,
        }}
      >
        <Spot n={1}>
          <Field>Comes after ▾</Field>
        </Spot>
        <Spot n={2}>
          <Field>2. Launch banner ▾</Field>
        </Spot>
        <Spot n={3}>
          <Field>Approved first ▾</Field>
        </Spot>
        <Field>Comes after ▾</Field>
        <Field>1. Print the flyers ▾</Field>
        <Field>Nothing, only the order ▾</Field>
      </span>
      <span style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Spot n={4}>
          <Field>When it waits on several: wait for all ▾</Field>
        </Spot>
        <Field>When what it waits on is late: keep waiting ▾</Field>
      </span>
    </Scene>
  );
}

export function StepChecks() {
  return (
    <Scene>
      <span
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 12,
        }}
      >
        <Panel title="Reads as">
          <Spot n={1}>
            <Small>
              On each event, <b>Marketing&apos;s least busy person</b> gets
              this, due <b>the day before at 5:00 PM</b>. It can&apos;t start
              until <b>Launch banner</b> is approved.
            </Small>
          </Spot>
        </Panel>
        <Panel title="Checks">
          <Spot n={2}>
            <span style={stack}>
              <Small>
                Share the recap is due at the same time as Edit the launch
                photos, which comes first.
              </Small>
              <FakeButton>Make it due 1 hour later</FakeButton>
            </span>
          </Spot>
        </Panel>
      </span>
    </Scene>
  );
}

export function GivePast() {
  return (
    <Scene>
      <Panel title="Give Launch banner to Sam?" pop>
        <Row>
          <Small>
            Sam is at capacity that week. This bigger task would put them over
            it.
          </Small>
        </Row>
        <Row>
          <Text title="Sam Rivera" sub="That week" />
          <Chip tone="warn">At capacity</Chip>
          <Small>→</Small>
          <Chip tone="alert">Over capacity</Chip>
        </Row>
        <Row>
          <Spot n={1}>
            <Field>Why it has to be Sam: only Sam has the launch photos.</Field>
          </Spot>
        </Row>
        <Row style={{ justifyContent: "flex-end" }}>
          <FakeButton>Back</FakeButton>
          <Spot n={2}>
            <FakeButton primary>Give past capacity</FakeButton>
          </Spot>
        </Row>
      </Panel>
    </Scene>
  );
}

export function MeantFor() {
  return (
    <Scene>
      <Panel title="Given to">
        <Row>
          <Text title="Design" sub="Waiting for someone in the group" />
        </Row>
        <Spot n={1}>
          <span style={stack}>
            <span style={line}>
              <b>Meant for Alex Moreau</b>
              <Chip tone="accent">Available</Chip>
            </span>
            <Small>
              The workflow names Alex, who had no room when it was planned.
            </Small>
          </span>
        </Spot>
        <Spot n={2}>
          <FakeButton primary>Give to Alex</FakeButton>
        </Spot>
      </Panel>
    </Scene>
  );
}

export function ViewingAs() {
  return (
    <Scene>
      <Spot n={1}>
        <Row>
          <Text
            title="Viewing as Contributor."
            sub="You see what people with only this role see. Nothing you do here is done as them."
          />
          <Spot n={2}>
            <FakeButton>Stop viewing</FakeButton>
          </Spot>
        </Row>
      </Spot>
      <Panel title="Settings › Roles › Contributor">
        <Row style={{ justifyContent: "flex-end" }}>
          <Spot n={3}>
            <FakeButton>View as Contributor</FakeButton>
          </Spot>
          <FakeButton>Reset</FakeButton>
          <FakeButton primary>Save changes</FakeButton>
        </Row>
      </Panel>
    </Scene>
  );
}

export function PlanningWarning() {
  return (
    <Scene>
      <Panel title="New event · Product launch">
        <Row>
          <Spot n={1}>
            <Small>
              <b>Workload warning.</b> This puts Design over capacity the week
              of Nov 23. Design is already limited that week. You can still
              create it; tasks nobody has room for wait for someone in the
              group.
            </Small>
          </Spot>
        </Row>
      </Panel>
      <Panel title="Design's next four weeks">
        <Spot n={2}>
          <span style={stack}>
            <Row>
              <Text title="Nov 16 – 22" />
              <Chip tone="accent">Available</Chip>
            </Row>
            <Row>
              <Text title="Nov 23 – 29" />
              <Chip tone="info">Limited</Chip>
            </Row>
          </span>
        </Spot>
      </Panel>
    </Scene>
  );
}

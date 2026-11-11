// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/pictures/workflowPictures.tsx
// Version : 1.0.0
// Latest commit: feature/docs-refresh
// Author : Gerrah
// Purpose : Pictures for Changing a workflow: a step changed, upcoming
// events following, the notification, a hand edit that stays, and updating
// one event from its menu.

import {
  Arrow,
  Chip,
  FakeButton,
  Face,
  Panel,
  Row,
  Scene,
  Small,
  Spot,
  Strike,
  Text,
} from "./kit";

export function StepChanged() {
  return (
    <Scene height={150} style={{ justifyContent: "center" }}>
      <Panel>
        <Row glow>
          <Text title="2. Prep twitter caption" sub="Marketing" />
          <Chip tone="accent">The day before</Chip>
        </Row>
      </Panel>
      <FakeButton primary>Save</FakeButton>
    </Scene>
  );
}

export function EventsFollow() {
  const events = ["vs. Nine Lives", "vs. Final Boss", "vs. Team Six"];
  return (
    <Scene height={150}>
      <Panel>
        {events.map((name) => (
          <Row key={name}>
            <Text
              title={name}
              sub={
                <>
                  Caption: <Strike>Thu 7 PM</Strike> → <b>Wed 8 PM</b>
                </>
              }
            />
          </Row>
        ))}
      </Panel>
    </Scene>
  );
}

export function Notified() {
  return (
    <Scene height={150} style={{ justifyContent: "center" }}>
      <Panel pop>
        <Row>
          <Face initials="LA" />
          <Text
            title="Laramie changed Match day"
            sub="3 of your upcoming tasks moved"
          />
        </Row>
      </Panel>
    </Scene>
  );
}

export function HandEditBefore() {
  return (
    <Scene height={130}>
      <Panel>
        <Row>
          <Text title="Prep twitter caption" sub="Sam moved it to Wed 5 PM" />
          <Chip tone="neutral">Changed by hand</Chip>
        </Row>
      </Panel>
      <Small>The workflow's step changes to "2 days before"…</Small>
    </Scene>
  );
}

export function HandEditAfter() {
  return (
    <Scene height={130}>
      <Panel>
        <Row glow>
          <Text
            title="Prep twitter caption"
            sub="Still Wed 5 PM, as Sam set it"
          />
          <Chip tone="neutral">Kept</Chip>
        </Row>
      </Panel>
      <Small>…its text and checklist still follow.</Small>
    </Scene>
  );
}

export function UpdateFromWorkflows() {
  return (
    <Scene height={240}>
      <span style={{ display: "flex", justifyContent: "flex-end" }}>
        <Spot n={1}>
          <FakeButton>⋯</FakeButton>
        </Spot>
      </span>
      <Panel pop title="Update tasks from workflows">
        <Row>
          <Text title="Prep twitter caption" sub="post text, checklist" />
          <Chip tone="accent">✓</Chip>
        </Row>
        <Row>
          <Text title="Publish Twitter post" sub="due time" />
          <Chip tone="accent">✓</Chip>
        </Row>
        <Row>
          <Spot n={2}>
            <Small>☐ Also move due times to the workflow's</Small>
          </Spot>
        </Row>
      </Panel>
      <Arrow>→ Update tasks</Arrow>
    </Scene>
  );
}

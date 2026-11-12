// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/pictures/planningPictures.tsx
// Version : 1.0.0
// Latest commit: feature/docs-refresh
// Author : Gerrah
// Purpose : Pictures for planning: the new event form, the warning about
// tasks that would already be late, who can make it, asking people to reply,
// repeating events, deleting a repeat and planning several at once.

import {
  Arrow,
  Check,
  Chip,
  Count,
  Face,
  FakeButton,
  Field,
  Heading,
  Panel,
  Row,
  Scene,
  Small,
  Spot,
  Switch,
  Text,
} from "./kit";

const label = { fontSize: 11, fontWeight: 700 } as const;
const fieldBlock = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
} as const;

export function NewEventForm() {
  return (
    <Scene height={260}>
      <Heading>New event</Heading>
      <Panel>
        <Row>
          <span style={{ ...fieldBlock, flexGrow: 1 }}>
            <span style={label}>Title</span>
            <Spot n={1}>
              <Field>vs. {"{opponent}"}</Field>
            </Spot>
          </span>
          <span style={fieldBlock}>
            <span style={label}>Opponent</span>
            <Field>Final Boss Black</Field>
          </span>
        </Row>
        <Row>
          <span style={{ ...fieldBlock, flexGrow: 1 }}>
            <span style={label}>Who's in it</span>
            <Spot n={2}>
              <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                <Chip tone="outline">Players</Chip>
                <Chip tone="outline">Marketing</Chip>
                <Chip tone="outline">Laramie</Chip>
              </span>
            </Spot>
          </span>
        </Row>
        <Row>
          <span style={{ ...fieldBlock, flexGrow: 1 }}>
            <span style={label}>Workflows</span>
            <Spot n={3}>
              <span style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Check on>Match day</Check>
                <Check>Recap video</Check>
              </span>
            </Spot>
          </span>
          <Spot n={4}>
            <FakeButton primary>Create</FakeButton>
          </Spot>
        </Row>
      </Panel>
    </Scene>
  );
}

export function LateWarning() {
  return (
    <Scene>
      <Panel pop>
        <Row>
          <Chip tone="warn">2 tasks would already be late</Chip>
        </Row>
        <Row>
          <Text title="Prep Gameday Graphic post" sub="Was due Tue 10:30 PM" />
        </Row>
        <Row>
          <Check on round>
            Create them, marked Late from the start
          </Check>
        </Row>
        <Row>
          <Check round>Leave them out</Check>
        </Row>
      </Panel>
    </Scene>
  );
}

export function WhoCanMake() {
  return (
    <Scene height={250}>
      <Panel>
        <Row>
          <Spot n={1}>
            <Chip tone="accent">7 of 8 required can make it</Chip>
          </Spot>
        </Row>
        <Row>
          <Face initials="SA" />
          <Text title="Saltyvl" sub={<Spot n={2}>Away: back Nov 16</Spot>} />
          <Spot n={3}>
            <Chip tone="outline">Required</Chip>
          </Spot>
        </Row>
        <Row>
          <Face initials="LA" />
          <Text title="Laramie (coach)" sub="Busy at 8 PM" />
          <Chip tone="neutral">Optional</Chip>
        </Row>
        <Row>
          <span style={{ ...fieldBlock, flexGrow: 1 }}>
            <Small>Everyone required is free at</Small>
            <Spot n={4}>
              <span style={{ display: "flex", gap: 4 }}>
                <Chip tone="outline">7:00 PM</Chip>
                <Chip tone="outline">9:30 PM</Chip>
              </span>
            </Spot>
          </span>
        </Row>
      </Panel>
    </Scene>
  );
}

export function AskReplyOn() {
  return (
    <Scene height={140} style={{ justifyContent: "center" }}>
      <Panel>
        <Row>
          <Text title="Ask people to reply" sub="Everyone starts as Required" />
          <Switch on />
        </Row>
      </Panel>
    </Scene>
  );
}

export function AskReplyNotice() {
  return (
    <Scene height={140} style={{ justifyContent: "center" }}>
      <Panel pop>
        <Row>
          <Face initials="GE" />
          <Text
            title="Are you going to vs. Orca?"
            sub="Thu 8:00 PM · Going · Maybe · Can't go"
          />
        </Row>
      </Panel>
    </Scene>
  );
}

export function AskReplyCounts() {
  return (
    <Scene height={140} style={{ justifyContent: "center" }}>
      <span style={{ display: "flex", gap: 4 }}>
        <Count n={6} label="Going" tone="accent" />
        <Count n={1} label="Maybe" tone="warn" />
        <Count n={1} label="Can't go" tone="alert" />
        <Count n={2} label="No reply" />
      </span>
      <FakeButton>Remind 2</FakeButton>
    </Scene>
  );
}

export function RepeatPicker() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <Scene>
      <Panel pop title="Repeat">
        <Row>
          <span style={{ display: "flex", gap: 4 }}>
            {days.map((day, index) => (
              <Chip
                key={`${day}${index}`}
                tone={index === 1 || index === 3 ? "accent" : "neutral"}
              >
                {day}
              </Chip>
            ))}
          </span>
        </Row>
        <Row>
          <span style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Check round>Never ends</Check>
            <Check round on>
              Ends Dec 18
            </Check>
            <Check round>After 10 events</Check>
          </span>
        </Row>
      </Panel>
      <Small>Scrims every Tuesday and Thursday until Dec 18.</Small>
    </Scene>
  );
}

export function DeleteRepeat() {
  return (
    <Scene>
      <Panel pop title="Delete Scrims">
        <Row>
          <Check round>Just this one · Thu Nov 19</Check>
        </Row>
        <Row glow>
          <Check round on>
            This and every later one · 8 events, 16 tasks
          </Check>
        </Row>
        <Row>
          <Check round>The whole series</Check>
        </Row>
        <Row>
          <Check on>Keep finished tasks as history</Check>
        </Row>
      </Panel>
    </Scene>
  );
}

export function SeveralShared() {
  return (
    <Scene height={150}>
      <Panel title="What they share">
        <Row>
          <Text title="NA Rise Fall Split" sub="Match · Thursdays 8:00 PM" />
        </Row>
        <Row>
          <Field>vs. {"{opponent}"}</Field>
        </Row>
      </Panel>
    </Scene>
  );
}

export function SeveralRows() {
  const rows: [string, string | null][] = [
    ["Nov 12", "Nine Lives"],
    ["Nov 19", null],
    ["Nov 26", null],
  ];
  return (
    <Scene height={150}>
      <Panel>
        {rows.map(([date, opponent]) => (
          <Row key={date}>
            <span style={{ width: 52 }}>{date}</span>
            {opponent ? <span>{opponent}</span> : <Chip tone="warn">TBD</Chip>}
          </Row>
        ))}
      </Panel>
      <Small>Add dates on a pattern, or paste from a spreadsheet.</Small>
    </Scene>
  );
}

export function SeveralMade() {
  return (
    <Scene height={150} style={{ justifyContent: "center" }}>
      <Panel>
        <Row>
          <Text title="NA Rise Fall Split" sub="8 events · 80 tasks" />
          <Chip tone="accent">Set</Chip>
        </Row>
      </Panel>
      <Arrow>Each event has its own tasks</Arrow>
    </Scene>
  );
}

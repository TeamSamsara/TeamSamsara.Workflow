// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/pictures/workPictures.tsx
// Version : 1.0.1
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Pictures for doing and checking work, and for building workflows:
// sending a task for review, approving or asking for changes, the live link,
// a workflow's tasks, due times counted from the event, and fields.

import type { CSSProperties } from "react";
import {
  Chip,
  Face,
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

const buttons: CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

export function ReviewSend() {
  return (
    <Scene>
      <Panel>
        <Row>
          <Text title="Speaker graphic" sub="Due Thu 12 PM" />
        </Row>
        <Row>
          <Chip tone="warn">Needs approval</Chip>
        </Row>
        <Row>
          <FakeButton primary>Send for review</FakeButton>
        </Row>
      </Panel>
    </Scene>
  );
}

export function ReviewDecide() {
  return (
    <Scene>
      <Panel title="Approval">
        <Row>
          <Face initials="AL" />
          <Text
            title="Speaker graphic"
            sub="Sent for review by Alex · 10 min ago"
          />
        </Row>
        <Row>
          <span style={buttons}>
            <FakeButton primary>Approve</FakeButton>
            <FakeButton>Ask for changes</FakeButton>
          </span>
        </Row>
      </Panel>
    </Scene>
  );
}

export function ReviewBack() {
  return (
    <Scene>
      <Panel title="Changes asked for">
        <Row>
          <Face initials="JO" />
          <Text
            title="Make the photo bigger, and add the start time."
            sub="Jordan"
          />
        </Row>
        <Row>
          <FakeButton primary>Send for review</FakeButton>
        </Row>
      </Panel>
    </Scene>
  );
}

export function AskChanges() {
  return (
    <Scene>
      <Panel pop title="Ask for changes">
        <Row>
          <Text title="What needs changing?" />
        </Row>
        <Row>
          <Field>Make the photo bigger, and add the start time.</Field>
        </Row>
        <Row>
          <span style={{ ...buttons, marginLeft: "auto" }}>
            <FakeButton>Cancel</FakeButton>
            <FakeButton primary>Send back</FakeButton>
          </span>
        </Row>
      </Panel>
    </Scene>
  );
}

export function LiveLink() {
  return (
    <Scene>
      <Panel title="Next step">
        <Row>
          <Text
            title="Link to what was published"
            sub="Paste the link to the post or video once it's live, so everyone can find it."
          />
        </Row>
        <Row>
          <Field>https://x.com/teamsamsara/status/18…</Field>
        </Row>
        <Row>
          <FakeButton primary>Mark as done</FakeButton>
        </Row>
      </Panel>
    </Scene>
  );
}

export function WorkflowTasks() {
  return (
    <Scene>
      <Heading>Workshop - Promotion</Heading>
      <span
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 8,
          alignItems: "start",
        }}
      >
        <Panel title="Tasks">
          <Row>
            <Spot n={1}>
              <Text title="Speaker graphic" sub="Marketing · The day before" />
            </Spot>
          </Row>
          <Row>
            <Text title="Write the announcement" sub="Alex · 6 hours before" />
            <Spot n={2}>
              <Chip tone="warn">Needs approval</Chip>
            </Spot>
          </Row>
          <Row>
            <Text title="Share the recap" sub="Marketing · 2 hours after" />
          </Row>
        </Panel>
        <span style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Panel title="About">
            <Row>
              <Spot n={3}>
                <Text title="Suggest for event type" sub="Workshop" />
              </Spot>
            </Row>
          </Panel>
          <Panel title="Fields it uses">
            <Row>
              <Spot n={4}>
                <Text title="{speaker}" sub="Asked when the event is planned" />
              </Spot>
            </Row>
          </Panel>
        </span>
      </span>
    </Scene>
  );
}

export function DueTimeline() {
  const marks: [string, string, boolean][] = [
    ["Sun 7 PM", "Speaker graphic · the day before", false],
    ["Mon 1 PM", "Write the announcement · 6 hours before", false],
    ["Mon 7 PM", "The workshop starts", true],
    ["Mon 9 PM", "Share the recap · 2 hours after", false],
  ];
  return (
    <Scene>
      <span
        style={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          paddingLeft: 20,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 5,
            top: 8,
            bottom: 8,
            width: 2,
            background: "var(--color-border)",
          }}
        />
        {marks.map(([when, what, start]) => (
          <span
            key={when}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              padding: "6px 0",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                left: -20,
                top: 9,
                width: 12,
                height: 12,
                borderRadius: 999,
                boxSizing: "border-box",
                background: start
                  ? "var(--color-accent)"
                  : "var(--color-surface)",
                border: "2px solid var(--color-text)",
              }}
            />
            <b style={{ width: 72, flexShrink: 0, fontSize: 12 }}>{when}</b>
            <span style={{ fontSize: 13, fontWeight: start ? 700 : 400 }}>
              {what}
            </span>
          </span>
        ))}
      </span>
    </Scene>
  );
}

export function FieldInWorkflow() {
  return (
    <Scene>
      <Panel>
        <Row>
          <Text title="Speaker graphic for {speaker}" sub="Task title" />
        </Row>
        <Row>
          <Text title="Join us tonight with {speaker}!" sub="Post text" />
        </Row>
      </Panel>
    </Scene>
  );
}

export function FieldFilled() {
  return (
    <Scene>
      <Panel>
        <Row glow>
          <Text title="Speaker graphic for Dana Reyes" sub="Task title" />
        </Row>
        <Row glow>
          <Text title="Join us tonight with Dana Reyes!" sub="Post text" />
        </Row>
      </Panel>
    </Scene>
  );
}

export function FieldTypes() {
  const fields: [string, string, string][] = [
    ["Speaker", "Text", "A word or a sentence"],
    ["Sign-up link", "Link", "A web address"],
    ["Seats", "Number", "A count or an amount"],
    ["Room", "Choice", "One from a list"],
    ["Rehearsal", "Date and time", "Shown in your formats"],
    ["Host", "Person", "Someone on the team"],
  ];
  return (
    <Scene>
      <Panel title="Fields">
        {fields.map(([name, type, hint]) => (
          <Row key={name}>
            <Text title={name} sub={hint} />
            <Chip tone="outline">{type}</Chip>
          </Row>
        ))}
      </Panel>
      <Small>Settings › Fields</Small>
    </Scene>
  );
}

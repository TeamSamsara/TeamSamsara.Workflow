// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/pictures/taskPictures.tsx
// Version : 1.0.0
// Latest commit: feature/docs-refresh
// Author : Gerrah
// Purpose : Pictures for My tasks: the page with its switches and parts, and
// how an event's tasks line up in their workflow's order.

import {
  Chip,
  Face,
  Heading,
  Panel,
  Row,
  Scene,
  Segments,
  Small,
  Spot,
  Tabs,
  Text,
} from "./kit";

export function MyTasksPage() {
  return (
    <Scene height={300}>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Heading>My tasks</Heading>
        <span style={{ marginLeft: "auto" }}>
          <Spot n={2}>
            <Tabs items={["Focus", "Planning", "Done this week"]} on={0} />
          </Spot>
        </span>
      </span>
      <Spot n={1}>
        <Segments items={["Mine", "My groups", "Pick groups"]} on={0} />
      </Spot>
      <Panel>
        <Row>
          <Spot n={3}>
            <Chip tone="alert">Late · 1</Chip>
          </Spot>
        </Row>
        <Row>
          <Text
            title="Upload voice coms to drive"
            sub="NA Rise Week #5 · Thu, Nov 5"
          />
          <Chip tone="outline">To do</Chip>
        </Row>
        <Row>
          <Chip tone="neutral">Next 7 days · 3</Chip>
        </Row>
        <Row>
          <Text
            title="Prep twitter caption"
            sub={<Spot n={4}>NA Rise Week #6 · Thu, Nov 12</Spot>}
          />
          <Face initials="GE" />
        </Row>
        <Row>
          <Text
            title="Publish Twitter post"
            sub="NA Rise Week #6 · Thu, Nov 12"
          />
          <Face initials="GE" />
        </Row>
      </Panel>
    </Scene>
  );
}

export function TaskOrder() {
  const steps = [
    ["1", "Prep Gameday Graphic post", "Tue"],
    ["2", "Prep twitter caption", "Wed"],
    ["4", "Publish Twitter post", "Wed"],
    ["6", "Send tourney code", "Thu"],
  ];
  return (
    <Scene height={200}>
      <Small>NA Rise Week #6 · its tasks, in the workflow's order</Small>
      <Panel>
        {steps.map(([n, title, day]) => (
          <Row key={n}>
            <Chip tone="neutral">Step {n}</Chip>
            <Text title={title} />
            <Small>{day}</Small>
          </Row>
        ))}
      </Panel>
    </Scene>
  );
}

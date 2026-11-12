// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/pictures/taskPictures.tsx
// Version : 1.0.1
// Latest commit: feature/audit-fixes
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
            title="Upload the photos"
            sub="Workshop: Kim Ortiz · Thu, Nov 5"
          />
          <Chip tone="outline">To do</Chip>
        </Row>
        <Row>
          <Chip tone="neutral">Next 7 days · 3</Chip>
        </Row>
        <Row>
          <Text
            title="Write the announcement"
            sub={<Spot n={4}>Workshop: Dana Reyes · Thu, Nov 12</Spot>}
          />
          <Face initials="AL" />
        </Row>
        <Row>
          <Text
            title="Publish the announcement"
            sub="Workshop: Dana Reyes · Thu, Nov 12"
          />
          <Face initials="AL" />
        </Row>
      </Panel>
    </Scene>
  );
}

export function TaskOrder() {
  const steps = [
    ["1", "Speaker graphic", "Tue"],
    ["2", "Write the announcement", "Wed"],
    ["4", "Publish the announcement", "Wed"],
    ["6", "Send the sign-up link", "Thu"],
  ];
  return (
    <Scene height={200}>
      <Small>Workshop: Dana Reyes · its tasks, in the workflow's order</Small>
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

// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/pictures/taskPictures.tsx
// Version : 1.1.0
// Latest commit: feature/1.2-wording-help
// Author : Gerrah
// Purpose : Pictures for My tasks: the page with its switches and parts, and
// how an event's tasks line up in due order, high priority first.

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
  const tasks: [string, string, boolean][] = [
    ["Print the flyers", "Tue 3 PM", false],
    ["Launch banner", "Wed 12 PM", true],
    ["Announcement post", "Wed 5 PM", false],
    ["Share the recap", "Fri 1 PM", false],
  ];
  return (
    <Scene height={200}>
      <Small>Product launch · its tasks, in due order</Small>
      <Panel>
        {tasks.map(([title, due, high]) => (
          <Row key={title}>
            <Text title={high ? `${title} ⚑` : title} />
            {high ? <Chip tone="alert">High priority</Chip> : null}
            <Small>{due}</Small>
          </Row>
        ))}
      </Panel>
    </Scene>
  );
}

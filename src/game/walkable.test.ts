import test from "node:test";
import assert from "node:assert/strict";
import { isWalkable, WALK_MAPS, type SceneId } from "./walkable";

test("屋里和院坝的默认落脚点都可行走", () => {
  for (const scene of Object.keys(WALK_MAPS) as SceneId[])
    assert.equal(isWalkable(scene, WALK_MAPS[scene].start), true, scene);
});

test("屋里家具和院坝道具不能成为落脚点", () => {
  const blocked = [
    ["home", { x: 0.12, y: 0.46 }],
    ["home", { x: 0.5, y: 0.72 }],
    ["home", { x: 0.15, y: 0.76 }],
    ["yard", { x: 0.26, y: 0.46 }],
    ["yard", { x: 0.68, y: 0.34 }],
    ["yard", { x: 0.5, y: 0.72 }],
    ["yard", { x: 0.82, y: 0.5 }],
  ] as const;
  for (const [scene, point] of blocked)
    assert.equal(isWalkable(scene, point), false, scene + JSON.stringify(point));
});

test("两景保留多块可达的空地", () => {
  const open = [
    ["home", { x: 0.42, y: 0.55 }],
    ["home", { x: 0.75, y: 0.55 }],
    ["home", { x: 0.5, y: 0.92 }],
    ["yard", { x: 0.52, y: 0.56 }],
    ["yard", { x: 0.3, y: 0.6 }],
    ["yard", { x: 0.72, y: 0.9 }],
  ] as const;
  for (const [scene, point] of open)
    assert.equal(isWalkable(scene, point), true, scene + JSON.stringify(point));
});

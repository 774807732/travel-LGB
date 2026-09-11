import test from "node:test";
import assert from "node:assert/strict";
import {
  findWalkPath,
  getWalkMap,
  initialScenePositions,
  isClearSegment,
  isWalkable,
  WALK_MAPS,
  WIDE_HARVEST_TRAYS,
  type SceneId,
} from "./walkable";

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
    assert.equal(
      isWalkable(scene, point),
      false,
      scene + JSON.stringify(point),
    );
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

test("横竖版各有独立落脚点与家具阻挡，缩窗不能把位置套到另一张图", () => {
  const positions = initialScenePositions();
  for (const layout of ["portrait", "wide"] as const) {
    for (const scene of ["home", "yard"] as const) {
      const map = getWalkMap(scene, layout);
      assert.ok(isWalkable(scene, positions[layout][scene], layout));
      for (const b of map.blockers) {
        const center = { x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2 };
        assert.equal(
          isWalkable(scene, center, layout),
          false,
          `${layout}/${scene}/${b.name}`,
        );
      }
    }
  }
  positions.wide.home.x = 0.4;
  assert.notEqual(positions.portrait.home.x, 0.4);
  assert.notEqual(getWalkMap("home", "wide").start.x, 0.4);
});

test("横版信桩位于小铺左侧靠墙，原空地可通行且不改变竖版", () => {
  const from = { x: 0.5, y: 0.65 };
  const to = { x: 0.8, y: 0.65 };
  assert.ok(isWalkable("yard", { x: 0.697, y: 0.65 }, "wide"));
  assert.ok(isClearSegment("yard", from, to, "wide"));
  assert.deepEqual(findWalkPath("yard", from, to, "wide"), [from, to]);
  const post = getWalkMap("yard", "wide").blockers.find(
    (b) => b.name === "信夹木桩",
  )!;
  assert.ok(post.left >= 0.6 && post.right <= 0.81, "信桩应在小铺左侧");
  assert.ok(post.bottom <= 0.62, "信桩需靠后墙，不能伸到院坝中央");
  assert.ok(isWalkable("yard", { x: 0.875, y: 0.62 }, "wide"));
  assert.equal(isWalkable("yard", { x: 0.68, y: 0.56 }, "wide"), false);
  assert.equal(
    isWalkable(
      "yard",
      { x: (post.left + post.right) / 2, y: post.bottom },
      "wide",
    ),
    false,
  );
  assert.equal(isWalkable("yard", { x: 0.82, y: 0.5 }, "portrait"), false);
});

test("横版簸箕沿左下红圈斜排，碰撞跟随且中央旧址重新可走", () => {
  assert.equal(WIDE_HARVEST_TRAYS.length, 3);
  const blockers = getWalkMap("yard", "wide").blockers.filter((b) =>
    b.name.startsWith("晒谷簸箕"),
  );
  assert.equal(blockers.length, 3);
  WIDE_HARVEST_TRAYS.forEach((point, i) => {
    assert.equal(isWalkable("yard", point, "wide"), false);
    assert.equal((blockers[i].left + blockers[i].right) / 2, point.x);
    if (i > 0) {
      assert.ok(point.x > WIDE_HARVEST_TRAYS[i - 1].x);
      assert.ok(point.y > WIDE_HARVEST_TRAYS[i - 1].y);
    }
  });
  assert.ok(isWalkable("yard", { x: 0.5, y: 0.85 }, "wide"));
  assert.ok(isClearSegment("yard", { x: 0.5, y: 0.65 }, { x: 0.5, y: 0.94 }, "wide"));
  // 不把桌面位置和碰撞套到手机竖版。
  assert.equal(getWalkMap("yard").blockers.filter((b) => b.name === "晒谷簸箕").length, 1);
  assert.equal(isWalkable("yard", { x: 0.5, y: 0.72 }), false);
});

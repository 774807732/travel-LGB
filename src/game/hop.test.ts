import test from "node:test";
import assert from "node:assert/strict";
import {
  HOP_DURATION,
  HOP_STRIDE_PX,
  groundDistance,
  sampleHop,
  splitIntoHops,
} from "./hop";
import {
  findWalkPath,
  isClearSegment,
  isWalkable,
  WALK_MAPS,
  getWalkMap,
  SCENE_ASPECTS,
  type SceneId,
} from "./walkable";

test("先蓄力再位移，空中仅一个抛物线，前掌接地后停止位移再缓冲", () => {
  for (const t of [0, 70, 139]) assert.equal(sampleHop(t).progress, 0);
  assert.equal(sampleHop(170).frame, 1, "后腿蹬伸帧必须出现");
  assert.equal(sampleHop(280).frame, 2, "腾空收腿帧");
  assert.equal(sampleHop(350).lift, 1);
  assert.equal(sampleHop(470).frame, 3, "前肢伸出迎接地面");
  for (const t of [560, 650, HOP_DURATION]) {
    assert.equal(sampleHop(t).progress, 1);
    assert.equal(sampleHop(t).lift, 0);
  }
  assert.equal(sampleHop(600).frame, 4);
  assert.equal(sampleHop(HOP_DURATION).done, true);
});

test("横版按实际宽高比分跳，760–1280px 场景仍每跳不超过 74px", () => {
  for (const [scene, target] of [
    ["home", { x: 0.8, y: 0.95 }],
    ["yard", { x: 0.8, y: 0.92 }],
  ] as const) {
    const start = getWalkMap(scene, "wide").start;
    const path = findWalkPath(scene, start, target, "wide");
    assert.ok(path, scene);
    for (const width of [760, 960, 1280]) {
      let previous = start;
      const hops = splitIntoHops(
        path,
        HOP_STRIDE_PX / width,
        SCENE_ASPECTS.wide,
      );
      for (const next of hops) {
        assert.ok(
          groundDistance(previous, next, SCENE_ASPECTS.wide) * width <=
            HOP_STRIDE_PX + 0.001,
        );
        assert.ok(isClearSegment(scene, previous, next, "wide"));
        previous = next;
      }
      assert.deepEqual(hops.at(-1), target);
    }
  }
});

test("绕过屋里矮桌和院坝簸箕，整条路径与每个小跳都不穿家具", () => {
  for (const [scene, target] of [
    ["home", { x: 0.5, y: 0.92 }],
    ["yard", { x: 0.65, y: 0.91 }],
  ] as const) {
    const start = WALK_MAPS[scene].start;
    assert.equal(isClearSegment(scene, start, target), false);
    const path = findWalkPath(scene, start, target);
    assert.ok(path && path.length > 2, scene);
    const hops = splitIntoHops(path);
    let previous = start;
    for (const next of hops) {
      assert.ok(groundDistance(previous, next) <= 0.190001);
      assert.ok(
        isClearSegment(scene, previous, next),
        JSON.stringify([scene, previous, next]),
      );
      assert.ok(isWalkable(scene, next));
      previous = next;
    }
    assert.deepEqual(hops.at(-1), target);
  }
});

test("无效点击不创建运动路径，两个场景的家具边界保留", () => {
  for (const scene of ["home", "yard"] as SceneId[]) {
    for (const target of [
      { x: 0.5, y: 0.72 },
      { x: NaN, y: 0.6 },
      { x: 0.5, y: -1 },
    ])
      assert.equal(findWalkPath(scene, WALK_MAPS[scene].start, target), null);
  }
});

import type { ScenePoint } from "./walkable";

export const HOP_TIMING = {
  crouch: 140,
  launch: 80,
  flight: 340,
  land: 150,
  settle: 100,
};
export const HOP_DURATION = Object.values(HOP_TIMING).reduce(
  (sum, ms) => sum + ms,
  0,
);
export const groundDistance = (a: ScenePoint, b: ScenePoint) =>
  Math.hypot(b.x - a.x, ((b.y - a.y) * 4) / 3);

// 各段都落在地面；长距离由多次完整蹬腿构成，不能拉长成一次滑行。
export function splitIntoHops(path: ScenePoint[], stride = 0.19): ScenePoint[] {
  const steps: ScenePoint[] = [];
  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1],
      to = path[i];
    const count = Math.max(1, Math.ceil(groundDistance(from, to) / stride));
    for (let part = 1; part <= count; part++) {
      const t = part / count;
      steps.push({
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
      });
    }
  }
  return steps;
}

export function sampleHop(elapsed: number) {
  const launchAt = HOP_TIMING.crouch;
  const landAt = launchAt + HOP_TIMING.launch + HOP_TIMING.flight;
  const airborne = Math.min(
    1,
    Math.max(0, (elapsed - launchAt) / (landAt - launchAt)),
  );
  const lift = 4 * airborne * (1 - airborne);
  const frame =
    elapsed < launchAt
      ? 0
      : elapsed < launchAt + HOP_TIMING.launch
        ? 1
        : elapsed < launchAt + HOP_TIMING.launch + 180
          ? 2
          : elapsed < landAt
            ? 3
            : elapsed < landAt + HOP_TIMING.land
              ? 4
              : 5;
  return { progress: airborne, lift, frame, done: elapsed >= HOP_DURATION };
}

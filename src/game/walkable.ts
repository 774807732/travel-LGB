export type SceneId = "home" | "yard";
export type ScenePoint = { x: number; y: number };

type Rectangle = {
  name: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
};

type WalkMap = {
  floor: ScenePoint[];
  blockers: Rectangle[];
  start: ScenePoint;
};

export const WALK_MAPS: Record<SceneId, WalkMap> = {
  home: {
    start: { x: 0.48, y: 0.59 },
    floor: [
      { x: 0.1, y: 0.37 },
      { x: 0.9, y: 0.37 },
      { x: 0.93, y: 0.6 },
      { x: 0.82, y: 0.94 },
      { x: 0.25, y: 0.94 },
      { x: 0.1, y: 0.76 },
    ],
    // 坐标以脚底落点计算，边界已给角色身体留出余量。
    blockers: [
      { name: "竹榻与陶罐", left: 0, top: 0.28, right: 0.29, bottom: 0.58 },
      { name: "窗下柜", left: 0.23, top: 0.27, right: 0.67, bottom: 0.45 },
      { name: "右侧柜", left: 0.86, top: 0.27, right: 1, bottom: 0.61 },
      { name: "小格架", left: 0, top: 0.61, right: 0.29, bottom: 0.91 },
      { name: "矮桌", left: 0.29, top: 0.62, right: 0.73, bottom: 0.89 },
      { name: "竹篓与盆栽", left: 0.79, top: 0.61, right: 1, bottom: 0.94 },
    ],
  },
  yard: {
    start: { x: 0.5, y: 0.6 },
    floor: [
      { x: 0.12, y: 0.4 },
      { x: 0.89, y: 0.39 },
      { x: 0.93, y: 0.82 },
      { x: 0.77, y: 0.97 },
      { x: 0.29, y: 0.97 },
      { x: 0.12, y: 0.83 },
    ],
    blockers: [
      { name: "门槛与石阶", left: 0, top: 0.32, right: 0.5, bottom: 0.54 },
      { name: "竹货架", left: 0.57, top: 0.23, right: 0.93, bottom: 0.45 },
      { name: "信夹木桩", left: 0.76, top: 0.34, right: 0.9, bottom: 0.63 },
      { name: "晒谷簸箕", left: 0.22, top: 0.64, right: 0.73, bottom: 0.81 },
      { name: "左侧花木", left: 0, top: 0.42, right: 0.23, bottom: 0.91 },
      { name: "竹篱", left: 0, top: 0.85, right: 0.3, bottom: 1 },
      { name: "右侧树盆", left: 0.89, top: 0.28, right: 1, bottom: 0.55 },
    ],
  },
};

function insidePolygon(point: ScenePoint, polygon: ScenePoint[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}

export function isWalkable(scene: SceneId, point: ScenePoint) {
  const map = WALK_MAPS[scene];
  if (!insidePolygon(point, map.floor)) return false;
  return !map.blockers.some(
    (blocker) =>
      point.x >= blocker.left &&
      point.x <= blocker.right &&
      point.y >= blocker.top &&
      point.y <= blocker.bottom,
  );
}


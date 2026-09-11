import { useEffect, useRef, type CSSProperties } from "react";
import {
  findWalkPath,
  SCENE_ASPECTS,
  type SceneLayout,
  type SceneId,
  type ScenePoint,
} from "../game/walkable";
import {
  groundDistance,
  HOP_STRIDE_PX,
  sampleHop,
  splitIntoHops,
} from "../game/hop";

export type HopCommand = { id: number; target: ScenePoint };
type Props = {
  scene: SceneId;
  layout: SceneLayout;
  position: ScenePoint;
  command: HopCommand | null;
  pose: string;
  leaving: boolean;
  quietMotion: boolean;
  onLand: (point: ScenePoint) => void;
  onBlocked: () => void;
  onToad: () => void;
};

export function ToadActor(props: Props) {
  const actor = useRef<HTMLButtonElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const controller = useRef<{
    move: (target: ScenePoint) => void;
    stop: (instant: boolean) => void;
  } | null>(null);

  useEffect(() => {
    const node = actor.current!;
    const sceneElement = node.parentElement!;
    let sceneWidth = sceneElement.getBoundingClientRect().width;
    const aspect = SCENE_ASPECTS[props.layout];
    const distancePx = (a: ScenePoint, b: ScenePoint) =>
      groundDistance(a, b, aspect) * sceneWidth;
    let current = { ...latest.current.position };
    let queued: ScenePoint | null = null;
    let route: ScenePoint[] = [];
    let hop: {
      from: ScenePoint;
      to: ScenePoint;
      started: number;
      height: number;
    } | null = null;
    let raf = 0,
      disposed = false,
      atlasReady = false;
    const atlas = new Image();
    const paint = (point: ScenePoint, lift = 0, frame = 5, height = 0) => {
      node.style.left = `${point.x * 100}%`;
      node.style.top = `${point.y * 100}%`;
      node.style.setProperty("--hop-lift", `${-lift * height}px`);
      node.style.setProperty("--hop-column", `${(frame % 3) * 50}%`);
      node.style.setProperty("--hop-row", frame < 3 ? "0%" : "100%");
      node.style.setProperty("--shadow-scale", String(1 - lift * 0.38));
      node.style.setProperty("--shadow-opacity", String(0.24 - lift * 0.12));
      node.dataset.hopFrame = String(frame);
    };
    const rest = () => {
      node.dataset.moving = "false";
      paint(current);
    };
    const stop = (instant: boolean) => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (instant) current = queued ?? route.at(-1) ?? hop?.to ?? current;
      queued = null;
      route = [];
      hop = null;
      rest();
      latest.current.onLand(current);
    };
    const tick = (now: number) => {
      raf = 0;
      if (disposed) return;
      if (!hop) {
        if (queued) {
          const path = findWalkPath(props.scene, current, queued, props.layout);
          queued = null;
          route = path
            ? splitIntoHops(
                path,
                HOP_STRIDE_PX / Math.max(1, sceneWidth),
                aspect,
              )
            : [];
          if (!path) latest.current.onBlocked();
        }
        const to = route.shift();
        if (!to) {
          rest();
          return;
        }
        if (distancePx(current, to) < 2) {
          current = to;
          latest.current.onLand(current);
          raf = requestAnimationFrame(tick);
          return;
        }
        // 只在落地后换朝向，空中不反转、不重置蓄力。
        if (Math.abs(to.x - current.x) > 0.006)
          node.style.setProperty(
            "--toad-facing",
            to.x < current.x ? "1" : "-1",
          );
        hop = {
          from: current,
          to,
          started: now,
          height: Math.min(30, 11 + distancePx(current, to) / 4),
        };
        node.dataset.moving = "true";
      }
      const sample = sampleHop(now - hop.started);
      paint(
        {
          x: hop.from.x + (hop.to.x - hop.from.x) * sample.progress,
          y: hop.from.y + (hop.to.y - hop.from.y) * sample.progress,
        },
        sample.lift,
        sample.frame,
        hop.height,
      );
      if (sample.done) {
        current = hop.to;
        hop = null;
        latest.current.onLand(current);
      }
      raf = requestAnimationFrame(tick);
    };
    controller.current = {
      move(target) {
        queued = target;
        if (latest.current.quietMotion) {
          stop(true);
          return;
        }
        if (!raf && atlasReady) raf = requestAnimationFrame(tick);
      },
      stop,
    };
    atlas.onload = () => {
      atlasReady = true;
      if (!disposed && queued && !raf) raf = requestAnimationFrame(tick);
    };
    atlas.onerror = () => {
      queued = null;
      rest();
    };
    atlas.src = "/art/characters/jump-atlas.webp";
    rest();
    const resize = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (Math.abs(width - sceneWidth) > 1) {
        // 窗口变化后撤回未完成跳跃，按新的像素尺寸重新规划下一次。
        sceneWidth = width;
        stop(false);
      }
    });
    resize.observe(sceneElement);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      atlas.onload = null;
      atlas.onerror = null;
      controller.current = null;
      resize.disconnect();
    };
  }, [props.scene, props.layout]);

  useEffect(() => {
    if (props.command && !props.leaving)
      controller.current?.move(props.command.target);
  }, [props.command?.id]);
  useEffect(() => {
    if (props.leaving) controller.current?.stop(false);
    else if (props.quietMotion) controller.current?.stop(true);
  }, [props.leaving, props.quietMotion]);

  return (
    <button
      ref={actor}
      className={"toad-hotspot " + (props.leaving ? "toad-leaving" : "")}
      aria-label="摸摸疙宝"
      style={
        {
          "--toad-x": `${props.position.x * 100}%`,
          "--toad-y": `${props.position.y * 100}%`,
        } as CSSProperties
      }
      onClick={(event) => {
        event.stopPropagation();
        props.onToad();
      }}
    >
      <span className="toad-ground-shadow" aria-hidden="true" />
      <span className="toad-body">
        <img
          className="toad-sprite"
          src={
            "/art/characters/" +
            (props.leaving ? "walking" : props.pose) +
            ".webp"
          }
          alt="宽胖、半垂眼的癞疙宝"
          draggable="false"
        />
        <span className="toad-jump-sprite" aria-hidden="true" />
      </span>
    </button>
  );
}

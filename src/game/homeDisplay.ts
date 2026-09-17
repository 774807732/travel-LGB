import { SOUVENIRS, type SouvenirId } from "./content";
import { advanceGame, type GameState } from "./engine";

export const DISPLAY_SLOTS = [
  { id: "shelfTop", name: "小格架上层" },
  { id: "shelfLower", name: "小格架下层" },
] as const;
export type DisplaySlotId = (typeof DISPLAY_SLOTS)[number]["id"];
export type HomeDisplay = Record<DisplaySlotId, SouvenirId | null>;

// 未布置过的旧档保留“最近带回的纪念物”展示；第一次编辑后固定保存，归来不再覆盖。
export function homeDisplay(state: GameState): HomeDisplay {
  return state.homeDisplay
    ? { shelfTop: state.homeDisplay.shelfTop, shelfLower: state.homeDisplay.shelfLower }
    : { shelfTop: state.completed.at(-1)?.souvenirId ?? null, shelfLower: null };
}

export function isHomeDisplay(
  value: unknown,
  owned: Record<string, unknown>,
): value is HomeDisplay {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  if (!DISPLAY_SLOTS.every((slot) => Object.hasOwn(value, slot.id))) return false;
  const seen = new Set<string>();
  return entries.every(([slot, id]) => {
    // window 只兼容上一轮本地三摆位存档；读档时收回，不再是可操作位置。
    if (slot !== "window" && !DISPLAY_SLOTS.some((s) => s.id === slot)) return false;
    if (id === null) return true;
    if (
      typeof id !== "string" || !SOUVENIRS.some((s) => s.id === id) ||
      typeof owned[id] !== "number" || !(owned[id] >= 1) || seen.has(id)
    ) return false;
    seen.add(id);
    return true;
  });
}

export function placeSouvenir(
  input: GameState,
  slot: DisplaySlotId,
  id: SouvenirId | null,
  now: number,
): GameState {
  const state = advanceGame(input, now);
  if (!DISPLAY_SLOTS.some((s) => s.id === slot)) throw new Error("这里还不能摆放。");
  if (id !== null && (!SOUVENIRS.some((s) => s.id === id) || (state.souvenirs[id] ?? 0) < 1))
    throw new Error("等它带回这件纪念物，再摆出来吧。");
  const display = { ...homeDisplay(state) };
  // 每种纪念物只占一个位置；换位置就是搬动，不扣库存，也不复制摆件。
  if (id !== null) {
    for (const target of DISPLAY_SLOTS) {
      if (display[target.id] === id) display[target.id] = null;
    }
  }
  display[slot] = id;
  return { ...state, homeDisplay: display };
}

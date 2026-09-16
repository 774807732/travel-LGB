import {
  availableLetters,
  hashSeed,
  newGame,
  type GameState,
  type Loadout,
  type Trip,
} from "./engine";
import {
  CARDS,
  FOODS,
  GEARS,
  ROUTES,
  SOUVENIRS,
  souvenirsForCard,
  type CardId,
  type SouvenirId,
} from "./content";

export const SAVE_KEY = "travel-toad:v1";
export const DEBUG_SAVE_KEY = "travel-toad:review:v1";
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export type StoragePort = Pick<Storage, "getItem" | "setItem">;
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const integer = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const time = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 1e15;
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) &&
  v.length <= 50000 &&
  v.every((x) => typeof x === "string") &&
  new Set(v).size === v.length;
function loadout(v: unknown): v is Loadout {
  return (
    record(v) &&
    FOODS.some((x) => x.id === v.food) &&
    (v.gear === null || GEARS.some((x) => x.id === v.gear))
  );
}
function trip(v: unknown, legacy = false): v is Trip {
  if (
    !record(v) ||
    !integer(v.number) ||
    v.number === 0 ||
    v.id !== "trip_" + v.number ||
    !loadout(v.loadout)
  )
    return false;
  if (
    !time(v.departedAt) ||
    !time(v.letterAt) ||
    !time(v.returnsAt) ||
    v.departedAt >= v.letterAt ||
    v.letterAt >= v.returnsAt
  )
    return false;
  if (!legacy && (!integer(v.seed) || v.seed > 0xffffffff)) return false;
  const route = ROUTES.find((x) => x.id === v.routeId);
  return (
    !!route &&
    CARDS.some((c) => c.id === v.cardId && c.routeId === route.id && (!c.requiredFood || c.requiredFood === (v.loadout as Loadout).food)) &&
    souvenirsForCard(v.cardId as CardId).some((s) => s.id === v.souvenirId)
  );
}
function base(v: unknown, legacy = false): v is Record<string, unknown> {
  if (
    !record(v) ||
    !["home", "packed", "traveling"].includes(v.phase as string) ||
    !integer(v.coins) ||
    v.coins > 1e9 ||
    !time(v.lastSeenAt)
  )
    return false;
  if (
    !record(v.inventory) ||
    !integer(v.inventory.food_yeerba) ||
    !integer(v.inventory.food_guokui) ||
    !integer(v.inventory.food_sweet_potato_congee) ||
    !strings(v.ownedGear) ||
    !v.ownedGear.every((g) => GEARS.some((x) => x.id === g))
  )
    return false;
  if (
    !Array.isArray(v.completed) ||
    v.completed.length > 10000 ||
    !v.completed.every((t) => trip(t, legacy)) ||
    new Set(v.completed.map((t) => t.id)).size !== v.completed.length
  )
    return false;
  if (
    !integer(v.nextTripNumber) ||
    v.nextTripNumber < 1 ||
    !strings(v.unlockedCards) ||
    !v.unlockedCards.every((c) => CARDS.some((x) => x.id === c)) ||
    !strings(v.readLetters) ||
    !integer(v.souvenirCount)
  )
    return false;
  if (
    typeof v.tutorialStarted !== "boolean" ||
    typeof v.hasUnreadReturn !== "boolean" ||
    typeof v.reducedMotion !== "boolean"
  )
    return false;
  if (
    v.phase === "home" &&
    (v.bag !== null || v.departureAt !== null || v.trip !== null)
  )
    return false;
  if (
    v.phase === "packed" &&
    (!loadout(v.bag) ||
      !time(v.departureAt) ||
      v.trip !== null ||
      (v.bag.food !== "food_home_meal" && Number(v.inventory[v.bag.food]) < 1))
  )
    return false;
  if (
    v.phase === "traveling" &&
    (!trip(v.trip, legacy) ||
      !loadout(v.bag) ||
      v.departureAt !== null ||
      v.trip.loadout.food !== v.bag.food ||
      v.trip.loadout.gear !== v.bag.gear)
  )
    return false;
  if (
    loadout(v.bag) &&
    v.bag.gear !== null &&
    !v.ownedGear.includes(v.bag.gear)
  )
    return false;
  const trips = [...v.completed, ...(trip(v.trip, legacy) ? [v.trip] : [])];
  if (
    trips.some((t, i) => t.number !== i + 1) ||
    v.nextTripNumber !== trips.length + 1 ||
    v.tutorialStarted !== trips.length > 0
  )
    return false;
  if (v.completed.some((t) => t.returnsAt > Number(v.lastSeenAt))) return false;
  if (trips.some((t, i) => i > 0 && trips[i - 1].returnsAt > t.departedAt))
    return false;
  if (
    v.readLetters.some(
      (id) =>
        !trips.some((t) => t.id === id && t.letterAt <= Number(v.lastSeenAt)),
    )
  )
    return false;
  return true;
}
export function isGameState(v: unknown): v is GameState {
  if (
    !base(v) ||
    v.version !== 2 ||
    !time(v.createdAt) ||
    Number(v.createdAt) > Number(v.lastSeenAt) ||
    !integer(v.seed) ||
    v.seed > 0xffffffff
  )
    return false;
  if (
    !time(v.harvestAt) ||
    Number(v.harvestAt) > Number(v.lastSeenAt) ||
    typeof v.soundEnabled !== "boolean" ||
    !["home", "yard"].includes(v.scene as string)
  )
    return false;
  if (!record(v.cardCollection) || !record(v.souvenirs)) return false;
  const unlocked = v.unlockedCards as string[];
  if (Object.keys(v.cardCollection).length !== unlocked.length) return false;
  for (const [id, entry] of Object.entries(v.cardCollection)) {
    if (
      !unlocked.includes(id) ||
      !record(entry) ||
      !integer(entry.count) ||
      entry.count < 1 ||
      !time(entry.firstAt) ||
      !time(entry.lastAt) ||
      entry.firstAt > entry.lastAt ||
      entry.lastAt > Number(v.lastSeenAt)
    )
      return false;
  }
  let total = 0;
  for (const [id, count] of Object.entries(v.souvenirs)) {
    if (!SOUVENIRS.some((x) => x.id === id) || !integer(count) || count < 1)
      return false;
    total += count;
  }
  if (total !== v.souvenirCount || total !== (v.completed as Trip[]).length)
    return false;
  const letters = [
    ...(v.completed as Trip[]),
    ...(trip(v.trip) && v.trip.letterAt <= Number(v.lastSeenAt)
      ? [v.trip]
      : []),
  ];
  if (
    letters.length !==
    Object.values(v.cardCollection).reduce<number>(
      (sum, entry) => sum + Number((entry as Record<string, unknown>).count),
      0,
    )
  )
    return false;
  for (const card of CARDS) {
    const matches = letters.filter((t) => t.cardId === card.id);
    const entry = v.cardCollection[card.id] as
      | { count: number; firstAt: number; lastAt: number }
      | undefined;
    if (matches.length !== (entry?.count ?? 0)) return false;
    if (
      matches.length &&
      (entry!.firstAt !== matches[0].letterAt ||
        entry!.lastAt !== matches.at(-1)!.letterAt)
    )
      return false;
  }
  for (const souvenir of SOUVENIRS) {
    if (
      (v.completed as Trip[]).filter((t) => t.souvenirId === souvenir.id)
        .length !== Number(v.souvenirs[souvenir.id] ?? 0)
    )
      return false;
  }
  return true;
}
function migrateV1(v: unknown): GameState | null {
  if (!base(v, true) || v.version !== 1) return null;
  const start = newGame(Number(v.lastSeenAt));
  const migrated = { ...start, ...v, version: 2 } as GameState;
  migrated.createdAt = Math.min(
    migrated.lastSeenAt,
    (v.completed as Trip[])[0]?.departedAt ?? migrated.lastSeenAt,
  );
  migrated.completed = (v.completed as Trip[]).map((t) => ({
    ...t,
    seed: hashSeed(t.number),
  }));
  migrated.trip = trip(v.trip, true)
    ? { ...v.trip, seed: hashSeed(v.trip.number) }
    : null;
  migrated.cardCollection = {};
  migrated.souvenirs = {};
  migrated.unlockedCards = [];
  for (const t of availableLetters(migrated)) {
    const old = migrated.cardCollection[t.cardId];
    migrated.cardCollection[t.cardId] = {
      count: (old?.count ?? 0) + 1,
      firstAt: old?.firstAt ?? t.letterAt,
      lastAt: t.letterAt,
    };
    if (!migrated.unlockedCards.includes(t.cardId))
      migrated.unlockedCards.push(t.cardId);
  }
  for (const t of migrated.completed)
    migrated.souvenirs[t.souvenirId] =
      (migrated.souvenirs[t.souvenirId] ?? 0) + 1;
  migrated.souvenirCount = migrated.completed.length;
  return isGameState(migrated) ? migrated : null;
}
export function decodeSave(raw: string): {
  state: GameState;
  migrated: boolean;
} {
  if (raw.length > MAX_IMPORT_BYTES) throw new Error("存档超过 5MB，未导入。");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("这不是可读取的 JSON 存档。");
  }
  // 既接受导出的带说明文件，也兼容旧版裸状态快照。
  if (record(value) && value.game === "travel-toad" && "state" in value)
    value = value.state;
  // 保留版本 1/2 的时间与数量，定向迁移旧圆石；不重算旅途、不重新发奖。
  let contentMigrated = false;
  if (record(value) && (value.version === 1 || value.version === 2)) {
    if (record(value.inventory) && !Object.hasOwn(value.inventory, "food_sweet_potato_congee")) {
      value.inventory.food_sweet_potato_congee = 0;
      contentMigrated = true;
    }
    for (const t of [...(Array.isArray(value.completed) ? value.completed : []), value.trip]) {
      if (record(t) && t.souvenirId === "souvenir_pebble") {
        t.souvenirId = "souvenir_glass_panda";
        contentMigrated = true;
      }
    }
    if (record(value.souvenirs) && Object.hasOwn(value.souvenirs, "souvenir_pebble")) {
      const count = value.souvenirs.souvenir_pebble;
      const current = value.souvenirs.souvenir_glass_panda ?? 0;
      if (!integer(count) || !integer(current)) throw new Error("收藏品数量有误，原存档未改动。");
      value.souvenirs.souvenir_glass_panda = current + count;
      delete value.souvenirs.souvenir_pebble;
      contentMigrated = true;
    }
  }
  if (isGameState(value)) return { state: value, migrated: contentMigrated };
  const migrated = migrateV1(value);
  if (migrated) return { state: migrated, migrated: true };
  throw new Error("存档版本或内容不完整，现有进度没有改变。");
}
export type LoadedGame = {
  state: GameState;
  warning: string | null;
  blocked: boolean;
  recovered?: boolean;
};
export function loadGame(
  storage: StoragePort,
  key: string,
  now: number,
  readOnly = false,
): LoadedGame {
  try {
    const raw = storage.getItem(key);
    if (raw === null)
      return { state: newGame(now), warning: null, blocked: false };
    try {
      const decoded = decodeSave(raw);
      return {
        state: decoded.state,
        warning: decoded.migrated
          ? "旧版进度已接续，原始存档会保留备份。"
          : null,
        blocked: false,
      };
    } catch {
      const backup = storage.getItem(key + ":backup");
      if (backup) {
        try {
          const decoded = decodeSave(backup);
          // 只有先保留损坏原文，才允许在有效备份上继续。
          if (!readOnly) storage.setItem(key + ":damaged", raw);
          return {
            state: decoded.state,
            warning: "主存档有异常，已从上一份有效备份恢复；异常原文已保留。",
            blocked: false,
            recovered: true,
          };
        } catch {
          /* 不删除原存档；没有可用备份则进入保护态。 */
        }
      }
      return {
        state: newGame(now),
        warning:
          "存档暂时无法读取，原文已保留。请在设置中导出原文、导入备份或确认重新开始。",
        blocked: true,
      };
    }
  } catch {
    return {
      state: newGame(now),
      warning: "浏览器未允许存档。本次可临时试玩，请及时导出备份。",
      blocked: false,
    };
  }
}
export function saveGame(
  storage: StoragePort,
  key: string,
  state: GameState,
): boolean {
  try {
    const previous = storage.getItem(key);
    if (previous) {
      let valid = false;
      try {
        decodeSave(previous);
        valid = true;
      } catch {
        /* 不拿坏数据替换有效备份。 */
      }
      if (valid) storage.setItem(key + ":backup", previous);
    }
    storage.setItem(key, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
export function archiveBeforeReplace(
  storage: StoragePort,
  key: string,
): boolean {
  try {
    const raw = storage.getItem(key);
    if (raw !== null) storage.setItem(key + ":before-replace", raw);
    return true;
  } catch {
    return false;
  }
}
export function exportGame(state: GameState): string {
  return JSON.stringify(
    { game: "travel-toad", exportedAt: new Date().toISOString(), state },
    null,
    2,
  );
}
export function previousGame(
  storage: StoragePort,
  key: string,
): GameState | null {
  for (const suffix of [":before-replace", ":backup"]) {
    const raw = storage.getItem(key + suffix);
    if (!raw) continue;
    try {
      return decodeSave(raw).state;
    } catch {
      /* 一份备份不可读时仍尝试下一份有效快照。 */
    }
  }
  return null;
}

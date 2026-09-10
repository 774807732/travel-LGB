import test from "node:test";
import assert from "node:assert/strict";
import {
  advanceGame,
  availableHarvests,
  buyItem,
  HARVEST_INTERVAL,
  harvest,
  newGame,
  prepareTrip,
  routeWeights,
  type GameState,
  type Loadout,
} from "./engine";
import { CARDS, ROUTES, SOUVENIRS } from "./content";
import {
  archiveBeforeReplace,
  decodeSave,
  exportGame,
  isGameState,
  loadGame,
  MAX_IMPORT_BYTES,
  previousGame,
  SAVE_KEY,
  saveGame,
} from "./storage";
const now = 1_800_000_000_000,
  meal: Loadout = { food: "food_home_meal", gear: null };
function travel(state: GameState) {
  const packed = prepareTrip(state, meal, state.lastSeenAt + 1);
  const out = advanceGame(packed, packed.departureAt!);
  return advanceGame(out, out.trip!.returnsAt);
}
function memory() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

test("内容完整：三地各三张见闻、两种纪念物，标识不重复", () => {
  assert.equal(CARDS.length, 9);
  assert.equal(SOUVENIRS.length, 6);
  assert.equal(new Set(CARDS.map((x) => x.id)).size, 9);
  for (const route of ROUTES) {
    assert.equal(CARDS.filter((c) => c.routeId === route.id).length, 3);
    assert.equal(SOUVENIRS.filter((s) => s.routeId === route.id).length, 2);
  }
});
test("路线倾向叠加但不锁定目的地；连续两次同地后排除", () => {
  assert.deepEqual(routeWeights(meal), {
    route_daoming: 1,
    route_chengdu_tea: 1,
    route_huanglongxi: 1,
  });
  assert.deepEqual(
    routeWeights({ food: "food_yeerba", gear: "gear_bamboo_flask" }),
    { route_daoming: 3, route_chengdu_tea: 1, route_huanglongxi: 1 },
  );
  assert.deepEqual(
    routeWeights({ food: "food_guokui", gear: "gear_oilpaper_umbrella" }),
    { route_daoming: 1, route_chengdu_tea: 2, route_huanglongxi: 2 },
  );
  assert.equal(
    routeWeights(meal, ["route_daoming", "route_daoming"]).route_daoming,
    0,
  );
});
test("100 组存档仅用免费饭均可收齐 9 卡与 6 物，期间不连去同地三次", () => {
  for (let seed = 1; seed <= 100; seed++) {
    let state = newGame(now, seed);
    const cards = new Set<string>(),
      gifts = new Set<string>();
    for (let n = 0; n < 60; n++) {
      state = travel(state);
      const trip = state.completed.at(-1)!;
      const previous = state.completed.slice(-3).map((t) => t.routeId);
      assert.ok(previous.length < 3 || new Set(previous).size > 1);
      const routeCards = CARDS.filter((c) => c.routeId === trip.routeId);
      if (routeCards.some((c) => !cards.has(c.id)))
        assert.ok(!cards.has(trip.cardId), "有未见卡时优先新卡");
      const routeGifts = SOUVENIRS.filter((s) => s.routeId === trip.routeId);
      if (routeGifts.some((s) => !gifts.has(s.id)))
        assert.ok(!gifts.has(trip.souvenirId), "有未收纪念物时优先新物");
      cards.add(trip.cardId);
      gifts.add(trip.souvenirId);
      assert.equal(isGameState(state), true);
      if (cards.size === 9 && gifts.size === 6) break;
    }
    assert.equal(cards.size, 9);
    assert.equal(gifts.size, 6);
  }
});
test("重复见闻累计次数、首末日期与总信数一致，重放不增加", () => {
  let state = newGame(now, 23);
  for (let i = 0; i < 30; i++) state = travel(state);
  assert.equal(
    Object.values(state.cardCollection).reduce((s, x) => s + x.count, 0),
    30,
  );
  assert.equal(state.souvenirCount, 30);
  const again = advanceGame(
    JSON.parse(JSON.stringify(state)),
    state.lastSeenAt + 86400000,
  );
  assert.deepEqual(again.cardCollection, state.cardCollection);
  assert.deepEqual(again.souvenirs, state.souvenirs);
  assert.equal(again.coins, state.coins);
  for (const card of CARDS) {
    const trips = state.completed.filter((t) => t.cardId === card.id);
    if (trips.length) {
      assert.equal(state.cardCollection[card.id]!.firstAt, trips[0].letterAt);
      assert.equal(
        state.cardCollection[card.id]!.lastAt,
        trips.at(-1)!.letterAt,
      );
    }
  }
});
test("商店扣款、吃食库存、永久用具和免费饭兜底", () => {
  const initial = newGame(now),
    food = buyItem(initial, "food_yeerba", now);
  assert.equal(food.coins, 16);
  assert.equal(food.inventory.food_yeerba, 1);
  assert.equal(initial.coins, 24);
  const gear = buyItem(initial, "gear_oilpaper_umbrella", now);
  assert.equal(gear.coins, 0);
  assert.deepEqual(gear.ownedGear, ["gear_oilpaper_umbrella"]);
  assert.throws(
    () => buyItem({ ...gear, coins: 24 }, "gear_oilpaper_umbrella", now),
    /已经有/,
  );
  assert.throws(() => buyItem(gear, "food_guokui", now), /盘缠不够/);
  assert.equal(prepareTrip(gear, meal, now).phase, "packed");
  assert.throws(() => buyItem(initial, "food_home_meal", now), /不用买/);
});
test("吃食库存上限 99，不吞钱；途中仍可采购", () => {
  const state = newGame(now);
  state.inventory.food_guokui = 99;
  assert.throws(() => buyItem(state, "food_guokui", now), /备了不少/);
  assert.equal(state.coins, 24);
  const p = prepareTrip(state, meal, now),
    out = advanceGame(p, p.departureAt!);
  assert.equal(
    buyItem(out, "food_yeerba", out.lastSeenAt).inventory.food_yeerba,
    1,
  );
});
test("开局一份收成；四小时一份，上限三份，不能重复领取", () => {
  const state = newGame(now);
  assert.equal(availableHarvests(state), 1);
  const first = harvest(state, now);
  assert.equal(first.coins, 36);
  assert.equal(availableHarvests(first), 0);
  assert.throws(() => harvest(first, now), /慢慢晒/);
  assert.equal(availableHarvests(first, now + HARVEST_INTERVAL - 1), 0);
  assert.equal(availableHarvests(first, now + HARVEST_INTERVAL), 1);
  const long = harvest(first, now + HARVEST_INTERVAL * 100);
  assert.equal(long.coins, 72);
  assert.equal(availableHarvests(long), 0);
});
test("未满仓收成保留不足四小时部分，满仓舍去溢出", () => {
  const start = harvest(newGame(now), now),
    half = harvest(start, now + HARVEST_INTERVAL * 1.5);
  assert.equal(availableHarvests(half, now + HARVEST_INTERVAL * 2), 1);
  const full = harvest(start, now + HARVEST_INTERVAL * 3.5);
  assert.equal(availableHarvests(full, now + HARVEST_INTERVAL * 4), 0);
  assert.equal(availableHarvests(full, NaN), 0);
  assert.equal(availableHarvests(full, now - 1000), 0);
});
test("导出导入往返覆盖全状态，旧版旅途安全升级", () => {
  let state = newGame(now, 9);
  for (let i = 0; i < 8; i++) state = travel(state);
  assert.deepEqual(decodeSave(exportGame(state)).state, state);
  const legacy = JSON.parse(JSON.stringify(travel(newGame(now))));
  legacy.version = 1;
  for (const key of [
    "createdAt",
    "seed",
    "harvestAt",
    "soundEnabled",
    "scene",
    "cardCollection",
    "souvenirs",
  ])
    delete legacy[key];
  for (const trip of legacy.completed) delete trip.seed;
  const decoded = decodeSave(JSON.stringify(legacy));
  assert.equal(decoded.migrated, true);
  assert.equal(decoded.state.completed.length, 1);
  assert.equal(decoded.state.souvenirs.souvenir_bamboo_mat, 1);
  assert.equal(decoded.state.coins, 32);
});
test("导入拒绝无效 JSON、未知版本、负数、错配的路线与奖励", () => {
  const state = travel(newGame(now));
  assert.throws(() => decodeSave("bad json"), /JSON/);
  assert.throws(() => decodeSave(" ".repeat(MAX_IMPORT_BYTES + 1)), /5MB/);
  for (const bad of [
    { ...state, version: 999 },
    { ...state, coins: -1 },
    { ...state, unlockedCards: ["unknown"] },
    { ...state, souvenirCount: 99 },
    { ...state, readLetters: ["trip_999"] },
    {
      ...state,
      completed: [{ ...state.completed[0], routeId: "route_huanglongxi" }],
    },
  ])
    assert.equal(isGameState(bad), false);
});
test("导入拒绝非连续旅程、库存欠账、伪造卡片次数及未来纪念物", () => {
  const state = travel(newGame(now));
  const bad1 = structuredClone(state);
  bad1.cardCollection.card_daoming_01!.count = 2;
  const bad2 = structuredClone(state);
  bad2.completed[0].returnsAt = now + 999999999;
  const bad3 = structuredClone(state);
  bad3.inventory.food_yeerba = -1;
  for (const bad of [bad1, bad2, bad3, { ...state, nextTripNumber: 4 }])
    assert.equal(isGameState(bad), false);
});
test("坏主存档从有效备份恢复，异常原文保留，不破坏有效备份", () => {
  const storage = memory(),
    state = travel(newGame(now));
  storage.setItem(SAVE_KEY, "broken");
  storage.setItem(SAVE_KEY + ":backup", exportGame(state));
  const loaded = loadGame(storage, SAVE_KEY, now);
  assert.equal(loaded.recovered, true);
  assert.deepEqual(loaded.state, state);
  assert.equal(storage.getItem(SAVE_KEY + ":damaged"), "broken");
  assert.equal(saveGame(storage, SAVE_KEY, state), true);
  assert.deepEqual(
    decodeSave(storage.getItem(SAVE_KEY + ":backup")!).state,
    state,
  );
});
test("主动替换前留独立备份，后续自动保存不会覆盖它", () => {
  const storage = memory(),
    state = travel(newGame(now));
  saveGame(storage, SAVE_KEY, state);
  assert.equal(archiveBeforeReplace(storage, SAVE_KEY), true);
  saveGame(storage, SAVE_KEY, newGame(now));
  saveGame(storage, SAVE_KEY, newGame(now + 100));
  assert.deepEqual(
    decodeSave(storage.getItem(SAVE_KEY + ":before-replace")!).state,
    state,
  );
});
test("备份写入失败时不覆盖原始存档，不假报保存成功", () => {
  const prior = exportGame(travel(newGame(now)));
  let primary = prior;
  const storage = {
    getItem: () => primary,
    setItem: (key: string, value: string) => {
      if (key !== SAVE_KEY) throw Error("full");
      primary = value;
    },
  };
  assert.equal(saveGame(storage, SAVE_KEY, newGame(now)), false);
  assert.equal(primary, prior);
  assert.equal(archiveBeforeReplace(storage, SAVE_KEY), false);
});
test("主动替换备份损坏时，恢复入口仍能找到有效自动备份", () => {
  const storage = memory(),
    state = travel(newGame(now));
  storage.setItem(SAVE_KEY + ":before-replace", "bad");
  storage.setItem(SAVE_KEY + ":backup", exportGame(state));
  assert.deepEqual(previousGame(storage, SAVE_KEY), state);
  storage.data.clear();
  assert.equal(previousGame(storage, SAVE_KEY), null);
});

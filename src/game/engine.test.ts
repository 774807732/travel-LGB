import test from "node:test";
import assert from "node:assert/strict";
import {
  advanceGame,
  availableLetters,
  cancelPreparation,
  markLetterRead,
  newGame,
  prepareTrip,
  type Loadout,
} from "./engine";
import {
  DEBUG_SAVE_KEY,
  isGameState,
  loadGame,
  SAVE_KEY,
  saveGame,
} from "./storage";
const now = 1_800_000_000_000;
const meal: Loadout = { food: "food_home_meal", gear: null };
const packed = () => prepareTrip(newGame(now), meal, now);

test("免费饭：零盘缠也可准备，不修改输入", () => {
  const state = { ...newGame(now), coins: 0 };
  assert.equal(prepareTrip(state, meal, now).phase, "packed");
  assert.equal(state.phase, "home");
});
test("教学边界：15 秒出发，60 秒来信，105 秒归来", () => {
  const p = packed();
  assert.equal(advanceGame(p, now + 14999).phase, "packed");
  const traveling = advanceGame(p, now + 15000);
  assert.equal(traveling.phase, "traveling");
  assert.equal(availableLetters(advanceGame(p, now + 59999)).length, 0);
  assert.equal(availableLetters(advanceGame(p, now + 60000)).length, 1);
  assert.equal(advanceGame(p, now + 104999).phase, "traveling");
  const returned = advanceGame(p, now + 105000);
  assert.equal(returned.phase, "home");
  assert.equal(returned.coins, 32);
  assert.equal(returned.souvenirCount, 1);
});
test("离线跨多个节点只结算一趟，读信和重放推进不重复奖励", () => {
  const offline = advanceGame(packed(), now + 86400000 * 7);
  assert.equal(offline.completed.length, 1);
  const reloaded = JSON.parse(JSON.stringify(offline));
  const read = markLetterRead(reloaded, "trip_1", now + 86400000 * 8);
  assert.equal(advanceGame(read, now + 86400000 * 9).coins, 32);
  assert.equal(read.souvenirCount, 1);
  assert.deepEqual(read.unlockedCards, ["card_daoming_01"]);
});
test("取消不损耗；出发仅扣吃食，不扣永久用具", () => {
  const start = newGame(now);
  start.inventory.food_yeerba = 1;
  start.ownedGear.push("gear_bamboo_flask");
  const p = prepareTrip(
    start,
    { food: "food_yeerba", gear: "gear_bamboo_flask" },
    now,
  );
  assert.equal(p.inventory.food_yeerba, 1);
  assert.equal(cancelPreparation(p, now + 5000).inventory.food_yeerba, 1);
  const out = advanceGame(p, now + 15000);
  assert.equal(out.inventory.food_yeerba, 0);
  assert.deepEqual(out.ownedGear, ["gear_bamboo_flask"]);
  assert.equal(advanceGame(out, now + 16000).inventory.food_yeerba, 0);
});
test("重复确认不延迟出发，真正换包重置等待", () => {
  const p = packed();
  p.inventory.food_yeerba = 1;
  assert.equal(prepareTrip(p, meal, now + 5000).departureAt, now + 15000);
  assert.equal(
    prepareTrip(p, { food: "food_yeerba", gear: null }, now + 5000).departureAt,
    now + 20000,
  );
});
test("旅途中不可改包；截止瞬间的取消先推进再拒绝", () => {
  assert.throws(() => cancelPreparation(packed(), now + 15000), /已经出发/);
  assert.throws(() => prepareTrip(packed(), meal, now + 15000), /已经出发/);
});
test("无库存或无用具不允许预留；不能提前读信", () => {
  assert.throws(
    () => prepareTrip(newGame(now), { food: "food_yeerba", gear: null }, now),
    /没有库存/,
  );
  assert.throws(
    () =>
      prepareTrip(
        newGame(now),
        { food: "food_home_meal", gear: "gear_bamboo_flask" },
        now,
      ),
    /还没有/,
  );
  assert.deepEqual(
    markLetterRead(packed(), "trip_1", now + 20000).readLetters,
    [],
  );
});
test("时间回拨、无效时间不撤销状态", () => {
  const out = advanceGame(packed(), now + 60000);
  assert.deepEqual(advanceGame(out, now - 1000), out);
  assert.deepEqual(advanceGame(out, NaN), out);
});
test("首趟后恢复日常时间；未读不阻塞下一趟", () => {
  const end = advanceGame(packed(), now + 105000);
  const next = prepareTrip(end, meal, now + 106000);
  const wait = next.departureAt! - (now + 106000);
  assert.ok(wait >= 120000 && wait <= 300000);
  const trip = advanceGame(next, next.departureAt!).trip!;
  assert.ok(
    trip.returnsAt - trip.departedAt >= 3600000 &&
      trip.returnsAt - trip.departedAt <= 14400000,
  );
  assert.equal(next.hasUnreadReturn, true);
});
test("日常旅行随机 1–4 小时，准备仍为 2–5 分钟，来信在中点", () => {
  const home = advanceGame(packed(), now + 105000);
  const durations = new Set<number>();
  const hourBands = new Set<number>();
  for (let seed = 0; seed < 1000; seed++) {
    const next = prepareTrip({ ...home, seed }, meal, home.lastSeenAt);
    const wait = next.departureAt! - home.lastSeenAt;
    assert.ok(wait >= 120000 && wait <= 300000);
    const out = advanceGame(next, next.departureAt!);
    const trip = out.trip!;
    const duration = trip.returnsAt - trip.departedAt;
    assert.ok(duration >= 3600000 && duration <= 14400000);
    assert.equal(duration % 1000, 0);
    assert.equal(trip.letterAt, trip.departedAt + duration / 2);
    assert.deepEqual(advanceGame(JSON.parse(JSON.stringify(out)), out.lastSeenAt).trip, trip);
    durations.add(duration);
    hourBands.add(Math.min(3, Math.floor(duration / 3600000)));
  }
  assert.ok(durations.size > 900, "不是固定时长");
  assert.deepEqual([...hourBands].sort(), [1, 2, 3], "覆盖新增的 1–2 小时及原有时段");
});
test("旧版在途存档保留出门/来信/归来时间，按原计划结算且不重发", () => {
  const home = advanceGame(packed(), now + 105000);
  const next = prepareTrip(home, meal, home.lastSeenAt);
  const legacy = advanceGame(next, next.departureAt!);
  // 旧版已出发的 3 小时旅行；新规则不可重新抽取这趟的时长或结果。
  legacy.trip!.letterAt = legacy.trip!.departedAt + 5400000;
  legacy.trip!.returnsAt = legacy.trip!.departedAt + 10800000;
  const savedTrip = structuredClone(legacy.trip!);
  const map = new Map<string, string>();
  const storage = {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value); },
  };
  assert.equal(saveGame(storage, DEBUG_SAVE_KEY, legacy), true);
  const loaded = loadGame(storage, DEBUG_SAVE_KEY, savedTrip.departedAt + 3600000);
  assert.equal(loaded.blocked, false);
  const resumed = advanceGame(loaded.state, savedTrip.departedAt + 3600000);
  assert.deepEqual(resumed.trip, savedTrip);
  assert.equal(availableLetters(resumed).some((t) => t.id === savedTrip.id), false);
  const letter = advanceGame(resumed, savedTrip.letterAt);
  assert.ok(availableLetters(letter).some((t) => t.id === savedTrip.id));
  assert.equal(advanceGame(letter, savedTrip.returnsAt - 1).phase, "traveling");
  const returned = advanceGame(letter, savedTrip.returnsAt);
  assert.deepEqual(returned.completed.at(-1), savedTrip);
  assert.equal(returned.coins, legacy.coins + 8);
  assert.equal(returned.souvenirCount, legacy.souvenirCount + 1);
  const replayed = advanceGame(JSON.parse(JSON.stringify(returned)), savedTrip.returnsAt + 86400000);
  assert.equal(replayed.phase, "home");
  assert.equal(replayed.completed.length, returned.completed.length);
  assert.equal(replayed.coins, returned.coins);
  assert.equal(replayed.souvenirCount, returned.souvenirCount);
});
test("固定结果经序列化后不改变；存档阶段校验", () => {
  for (const at of [0, 15000, 60000, 105000]) {
    const state = advanceGame(packed(), now + at);
    assert.equal(isGameState(JSON.parse(JSON.stringify(state))), true);
  }
  const original = advanceGame(packed(), now + 15000);
  assert.deepEqual(
    advanceGame(JSON.parse(JSON.stringify(original)), now + 30000).trip,
    original.trip,
  );
  assert.equal(isGameState({ ...newGame(now), phase: "traveling" }), false);
  assert.equal(isGameState({ ...newGame(now), coins: -1 }), false);
});
test("持久化往返、坏存档保护、禁用存储降级、测试存档隔离", () => {
  const map = new Map<string, string>();
  const storage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
  assert.equal(saveGame(storage, SAVE_KEY, packed()), true);
  assert.deepEqual(loadGame(storage, SAVE_KEY, now).state, packed());
  assert.equal(loadGame(storage, DEBUG_SAVE_KEY, now).state.phase, "home");
  map.set(SAVE_KEY, "broken");
  assert.equal(loadGame(storage, SAVE_KEY, now).blocked, true);
  assert.equal(map.get(SAVE_KEY), "broken");
  const denied = {
    getItem: () => {
      throw Error("denied");
    },
    setItem: () => {
      throw Error("denied");
    },
  };
  assert.equal(saveGame(denied, SAVE_KEY, packed()), false);
  assert.ok(loadGame(denied, SAVE_KEY, now).warning);
});

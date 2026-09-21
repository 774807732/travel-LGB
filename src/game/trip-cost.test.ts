import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  advanceGame, buyItem, cancelPreparation, harvest, newGame, nextEventAt,
  prepareTrip, spendableCoins, TRIP_COST, type GameState, type Loadout,
} from "./engine";
import { decodeSave, exportGame, isGameState, loadGame, saveGame, DEBUG_SAVE_KEY } from "./storage";
import { sixteenCardSave } from "./fixtures/sixteen-card-save";

const now = 1_800_000_000_000;
const meal: Loadout = { food: "food_home_meal", gear: null };
const restore = (state: GameState) => decodeSave(exportGame(state)).state;

test("路费固定12文；首趟/普通趟均在出门扣，12文恰好够且归来仍加8文", () => {
  assert.equal(TRIP_COST, 12);
  const start = { ...newGame(now), coins: 12 };
  const packed = prepareTrip(start, meal, now);
  assert.equal(packed.coins, 12);
  assert.equal(advanceGame(packed, packed.departureAt! - 1).coins, 12);
  const out = advanceGame(restore(packed), packed.departureAt!);
  assert.equal(out.coins, 0);
  assert.equal(out.phase, "traveling");
  const home = advanceGame(restore(out), out.trip!.returnsAt);
  assert.equal(home.coins, 8);
  assert.throws(() => prepareTrip(home, meal, home.lastSeenAt), /还差 4 文/);
  const next = prepareTrip(harvest(home, home.lastSeenAt), meal, home.lastSeenAt);
  assert.equal(next.coins, 20);
  assert.equal(advanceGame(next, next.departureAt!).coins, 8);
  assert.equal(start.coins, 12);
});

test("0至11文不足时不准备、不耗吃食或用具、不修改输入", () => {
  for (const coins of [0, 1, 11]) {
    const start = { ...newGame(now), coins };
    start.inventory.food_yeerba = 1;
    start.ownedGear.push("gear_bamboo_flask");
    const before = structuredClone(start);
    for (const bag of [meal, { food: "food_yeerba", gear: "gear_bamboo_flask" } as const])
      assert.throws(() => prepareTrip(start, bag, now), /先去院坝收成/);
    assert.deepEqual(start, before);
  }
});

test("改包/重复确认/取消都不扣路费，取消释放预留，付费吃食仅出门用一份", () => {
  const start = newGame(now);
  start.inventory.food_yeerba = 1;
  const packed = prepareTrip(start, meal, now);
  const again = prepareTrip(restore(packed), meal, now + 1000);
  assert.equal(again.departureAt, packed.departureAt);
  const changed = prepareTrip(again, { food: "food_yeerba", gear: null }, now + 2000);
  assert.equal(changed.coins, 24);
  assert.equal(spendableCoins(changed), 12);
  const cancelled = cancelPreparation(restore(changed), now + 3000);
  assert.equal(cancelled.coins, 24);
  assert.equal(spendableCoins(cancelled), 24);
  assert.equal(cancelled.inventory.food_yeerba, 1);
  const out = advanceGame(changed, changed.departureAt!);
  assert.equal(out.coins, 12);
  assert.equal(out.inventory.food_yeerba, 0);
  assert.equal(advanceGame(restore(out), out.lastSeenAt + 1).coins, 12);
});

test("预备时购物不能花掉12文路费，取消后可用余额恢复；出门边界购物先扣路费", () => {
  const packed = prepareTrip(newGame(now), meal, now);
  const bought = buyItem(packed, "food_yeerba", now + 1000);
  assert.equal(bought.coins, 16);
  assert.equal(spendableCoins(bought), 4);
  assert.throws(() => buyItem(bought, "food_guokui", now + 2000), /已预留 12 文路费/);
  assert.throws(() => buyItem(packed, "gear_bamboo_flask", now + 2000), /已预留/);
  const cancelled = cancelPreparation(bought, now + 2000);
  assert.equal(buyItem(cancelled, "food_guokui", now + 2000).coins, 8);
  const boundary = buyItem(packed, "food_yeerba", packed.departureAt!);
  assert.equal(boundary.phase, "traveling");
  assert.equal(boundary.coins, 4);
  assert.equal(spendableCoins(boundary), 4);
});

test("离线跨出门/来信/归来、刷新、导出导入、时间回拨均不重复扣路费", () => {
  const packed = prepareTrip(newGame(now), meal, now);
  const out = advanceGame(restore(packed), packed.departureAt!);
  const letter = advanceGame(restore(out), out.trip!.letterAt);
  assert.equal(letter.coins, 12);
  assert.equal(letter.souvenirCount, 0);
  const offline = advanceGame(restore(packed), now + 7 * 86400000);
  assert.equal(offline.coins, 20);
  assert.equal(offline.completed.length, 1);
  assert.equal(offline.souvenirCount, 1);
  assert.deepEqual(advanceGame(restore(offline), now), offline);
  assert.deepEqual(advanceGame(restore(offline), NaN), offline);
  assert.equal(advanceGame(restore(offline), now + 8 * 86400000).coins, 20);
});

test("旧版不足路费的预备档仍能读取；到点留家不扣钱食物，收成后重新准备", () => {
  for (const coins of [0, 11]) {
    const old: GameState = {
      ...newGame(now), coins, phase: "packed", bag: { food: "food_yeerba", gear: null },
      departureAt: now + 15000,
      inventory: {
        food_yeerba: 1,
        food_guokui: 0,
        food_sweet_potato_congee: 0,
        food_douhua_rice: 0,
        food_sugar_oil_fruit: 0,
        food_brown_sugar_lianggao: 0,
      },
    };
    assert.ok(isGameState(old));
    const before = advanceGame(restore(old), now + 14999);
    assert.equal(before.phase, "packed");
    const blocked = advanceGame(restore(before), now + 86400000);
    assert.equal(blocked.phase, "home");
    assert.equal(blocked.coins, coins);
    assert.equal(blocked.inventory.food_yeerba, 1);
    assert.equal(blocked.nextTripNumber, 1);
    assert.equal(blocked.tutorialStarted, false);
    assert.equal(nextEventAt(blocked), null);
    assert.ok(isGameState(blocked));
    const funded = harvest(blocked, blocked.lastSeenAt);
    assert.equal(advanceGame(funded, funded.lastSeenAt + 1).phase, "home");
    const next = prepareTrip(funded, old.bag!, funded.lastSeenAt);
    const out = advanceGame(next, next.departureAt!);
    assert.equal(out.coins, funded.coins - 12);
    assert.equal(out.inventory.food_yeerba, 0);
  }
});

test("旧版足额预备档保留出发时间，首次推进只收一次12文", () => {
  const old: GameState = { ...newGame(now), phase: "packed", bag: meal, departureAt: now + 3000 };
  const restored = restore(old);
  assert.equal(restored.departureAt, old.departureAt);
  const out = advanceGame(restored, old.departureAt!);
  assert.equal(out.coins, 12);
  assert.equal(out.trip!.departedAt, old.departureAt);
  assert.deepEqual(advanceGame(restore(out), out.lastSeenAt), out);
});

test("真正旧版在途/历史档不追扣路费、无迁移，原时间和奖励保留", () => {
  const old = sixteenCardSave();
  const pending = old.completed.pop()!;
  delete old.cardCollection[pending.cardId];
  old.unlockedCards = old.unlockedCards.filter(id => id !== pending.cardId);
  old.souvenirs[pending.souvenirId]!--;
  old.souvenirCount--;
  old.coins = 0;
  old.lastSeenAt = pending.departedAt;
  old.phase = "traveling";
  old.bag = pending.loadout;
  old.trip = pending;
  const decoded = decodeSave(exportGame(old));
  assert.equal(decoded.migrated, false);
  const mid = advanceGame(decoded.state, pending.letterAt);
  assert.equal(mid.coins, 0);
  assert.deepEqual(mid.trip, pending);
  const end = advanceGame(restore(mid), pending.returnsAt);
  assert.equal(end.coins, 8);
  assert.equal(end.completed.length, 16);
  assert.deepEqual(advanceGame(restore(end), end.lastSeenAt).completed, end.completed);
  assert.equal(advanceGame(restore(end), end.lastSeenAt + 86400000).coins, 8);
});

test("出发保存失败后从原预备档重试，扣款仍只有一次", () => {
  const packed = prepareTrip(newGame(now), meal, now);
  let raw = JSON.stringify(packed);
  let fail = true;
  const storage = {
    getItem: (key: string) => key === DEBUG_SAVE_KEY ? raw : null,
    setItem: (key: string, value: string) => {
      if (fail && key === DEBUG_SAVE_KEY) throw new Error("full");
      if (key === DEBUG_SAVE_KEY) raw = value;
    },
  };
  const go = () => advanceGame(loadGame(storage, DEBUG_SAVE_KEY, now).state, packed.departureAt!);
  assert.equal(saveGame(storage, DEBUG_SAVE_KEY, go()), false);
  assert.equal(JSON.parse(raw).coins, 24);
  fail = false;
  assert.equal(saveGame(storage, DEBUG_SAVE_KEY, go()), true);
  assert.equal(saveGame(storage, DEBUG_SAVE_KEY, go()), true);
  assert.equal(JSON.parse(raw).coins, 12);
});

test("行囊/小铺/帮助使用统一路费，移除零盘缠可出游的旧承诺", () => {
  const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
  assert.match(app, /aria-label="出游盘缠"/);
  assert.match(app, /每次出门消耗 \{TRIP_COST\} 文盘缠，首趟也一样/);
  assert.match(app, /每次实际出门扣 \{TRIP_COST\} 文盘缠/);
  assert.match(app, /spendableCoins\(state\) < item.price/);
  assert.doesNotMatch(app, /没有盘缠，也不会卡住旅行|没有盘缠，还有家常饭|免费家常饭也能收齐全部见闻/);
});

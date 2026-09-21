import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CARDS, FOODS, GEARS, SOUVENIRS, type SouvenirId } from "./content";
import {
  advanceGame,
  buyItem,
  newGame,
  prepareTrip,
  routeWeights,
  type GameState,
  type Loadout,
} from "./engine";
import { decodeSave, exportGame, isGameState } from "./storage";
import { withTravelBudget } from "./fixtures/travel-budget";

const now = 1_800_000_000_000;
const meal: Loadout = { food: "food_home_meal", gear: null };

function afterTutorial(seed = 91): GameState {
  const packed = prepareTrip(newGame(now, seed), meal, now);
  const traveling = advanceGame(packed, packed.departureAt!);
  return advanceGame(traveling, traveling.trip!.returnsAt);
}

test("小铺新增三种食物与三件永久用具，名称、价格和初始状态明确", () => {
  assert.deepEqual(
    FOODS.slice(-3).map(({ id, name, price }) => ({ id, name, price })),
    [
      { id: "food_douhua_rice", name: "豆花饭", price: 8 },
      { id: "food_sugar_oil_fruit", name: "糖油果子", price: 10 },
      { id: "food_brown_sugar_lianggao", name: "红糖凉糕", price: 10 },
    ],
  );
  assert.deepEqual(
    GEARS.slice(-3).map(({ id, name, price }) => ({ id, name, price })),
    [
      { id: "gear_enamel_tea_mug", name: "搪瓷茶缸", price: 24 },
      { id: "gear_small_packbasket", name: "小背篼", price: 30 },
      { id: "gear_bamboo_whistle", name: "竹哨子", price: 30 },
    ],
  );
  const state = newGame(now);
  assert.equal(state.inventory.food_douhua_rice, 0);
  assert.equal(state.inventory.food_sugar_oil_fruit, 0);
  assert.equal(state.inventory.food_brown_sugar_lianggao, 0);
  assert.ok(!state.ownedGear.some((id) => GEARS.slice(-3).some((item) => item.id === id)));
});

test("豆花饭偏向河街、搪瓷茶缸偏向坝坝茶，但都不锁死目的地", () => {
  assert.deepEqual(routeWeights({ food: "food_douhua_rice", gear: null }), {
    route_daoming: 1,
    route_chengdu_tea: 1,
    route_huanglongxi: 2,
    route_tianba: 1,
  });
  assert.deepEqual(routeWeights({ food: "food_home_meal", gear: "gear_enamel_tea_mug" }), {
    route_daoming: 1,
    route_chengdu_tea: 2,
    route_huanglongxi: 1,
    route_tianba: 1,
  });
});

test("糖油果子只偏向当前吃食可获得且尚未收录见闻的地点", () => {
  const missing = "card_river_01";
  const progress = {
    unlockedCards: CARDS.map((card) => card.id).filter((id) => id !== missing),
    souvenirs: Object.fromEntries(SOUVENIRS.map((item) => [item.id, 1])),
  };
  assert.deepEqual(
    routeWeights({ food: "food_sugar_oil_fruit", gear: null }, [], progress),
    {
      route_daoming: 1,
      route_chengdu_tea: 1,
      route_huanglongxi: 2,
      route_tianba: 1,
    },
  );
  assert.deepEqual(
    routeWeights(
      { food: "food_sugar_oil_fruit", gear: null },
      [],
      { ...progress, unlockedCards: CARDS.map((card) => card.id) },
    ),
    routeWeights({ food: "food_home_meal", gear: null }),
  );
});

test("小背篼偏向仍缺纪念物的地点，不改变每趟一件的结算规则", () => {
  const missing = "souvenir_small_pumpkin" as SouvenirId;
  const progress = {
    unlockedCards: CARDS.map((card) => card.id),
    souvenirs: Object.fromEntries(
      SOUVENIRS.filter((item) => item.id !== missing).map((item) => [item.id, 1]),
    ),
  };
  assert.deepEqual(
    routeWeights({ food: "food_home_meal", gear: "gear_small_packbasket" }, [], progress),
    {
      route_daoming: 1,
      route_chengdu_tea: 1,
      route_huanglongxi: 1,
      route_tianba: 2,
    },
  );
  const state = afterTutorial();
  assert.equal(state.souvenirCount, state.completed.length);
});

test("红糖凉糕把普通旅程缩短15%，来信仍在旅程中点", () => {
  const home = withTravelBudget(afterTutorial(27), 32);
  home.inventory.food_brown_sugar_lianggao = 1;
  const normalPacked = prepareTrip(home, meal, home.lastSeenAt + 1);
  const fastPacked = prepareTrip(
    home,
    { food: "food_brown_sugar_lianggao", gear: null },
    home.lastSeenAt + 1,
  );
  const normal = advanceGame(normalPacked, normalPacked.departureAt!).trip!;
  const fast = advanceGame(fastPacked, fastPacked.departureAt!).trip!;
  const normalDuration = normal.returnsAt - normal.departedAt;
  const fastDuration = fast.returnsAt - fast.departedAt;
  assert.equal(fastDuration, Math.round((normalDuration * 0.85) / 1000) * 1000);
  assert.equal(fast.letterAt, fast.departedAt + fastDuration / 2);
});

test("竹哨子只缩短普通出发等待，首趟教学仍是15秒", () => {
  const tutorial = newGame(now, 19);
  tutorial.ownedGear.push("gear_bamboo_whistle");
  assert.equal(
    prepareTrip(tutorial, { food: "food_home_meal", gear: "gear_bamboo_whistle" }, now)
      .departureAt! - now,
    15000,
  );
  const home = afterTutorial(19);
  home.ownedGear.push("gear_bamboo_whistle");
  for (let seed = 0; seed < 100; seed++) {
    const state = { ...home, seed };
    const packed = prepareTrip(
      state,
      { food: "food_home_meal", gear: "gear_bamboo_whistle" },
      state.lastSeenAt,
    );
    const wait = packed.departureAt! - state.lastSeenAt;
    assert.ok(wait >= 90000 && wait <= 180000);
  }
});

test("新增商品遵守购买、库存、取消和出发扣除规则", () => {
  let state = { ...newGame(now), coins: 80 };
  state = buyItem(state, "food_douhua_rice", now);
  state = buyItem(state, "gear_enamel_tea_mug", now);
  assert.equal(state.coins, 48);
  assert.equal(state.inventory.food_douhua_rice, 1);
  assert.deepEqual(state.ownedGear, ["gear_enamel_tea_mug"]);
  const packed = prepareTrip(
    state,
    { food: "food_douhua_rice", gear: "gear_enamel_tea_mug" },
    now,
  );
  assert.equal(packed.inventory.food_douhua_rice, 1);
  const out = advanceGame(packed, packed.departureAt!);
  assert.equal(out.inventory.food_douhua_rice, 0);
  assert.equal(out.coins, 36);
  assert.throws(() => buyItem(state, "gear_enamel_tea_mug", now), /已经有/);
});

test("旧版version=2存档缺少三种新库存时补零，不重算旅程或赠送商品", () => {
  const state = afterTutorial(41);
  const old = JSON.parse(exportGame(state));
  for (const id of [
    "food_douhua_rice",
    "food_sugar_oil_fruit",
    "food_brown_sugar_lianggao",
  ])
    delete old.state.inventory[id];
  const originalTrips = structuredClone(old.state.completed);
  const decoded = decodeSave(JSON.stringify(old));
  assert.equal(decoded.migrated, true);
  assert.deepEqual(decoded.state.completed, originalTrips);
  assert.equal(decoded.state.inventory.food_douhua_rice, 0);
  assert.equal(decoded.state.inventory.food_sugar_oil_fruit, 0);
  assert.equal(decoded.state.inventory.food_brown_sugar_lianggao, 0);
  assert.ok(!decoded.state.ownedGear.some((id) => GEARS.slice(-3).some((item) => item.id === id)));
  assert.equal(isGameState(decoded.state), true);
});

test("小铺使用食物/道具双页签，并提示购买后不足12文路费", async () => {
  const [app, css] = await Promise.all([
    readFile("src/App.tsx", "utf8"),
    readFile("src/styles.css", "utf8"),
  ]);
  assert.match(app, /className="shop-tabs"/);
  assert.match(app, /aria-label="小铺分类"/);
  assert.match(app, /买后还差 \{TRIP_COST - \(state\.coins - item\.price\)\} 文出门/);
  assert.match(css, /\.shop-tabs \[aria-pressed="true"\]/);
  assert.match(css, /\.shop-row \.purchase-warning/);
});

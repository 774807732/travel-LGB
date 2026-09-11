import test from "node:test";
import assert from "node:assert/strict";
import { advanceGame, buyItem, newGame, prepareTrip, routeWeights, type GameState, type Loadout } from "./engine";
import { decodeSave, isGameState } from "./storage";
import { SOUVENIRS } from "./content";
const now = 1_800_000_000_000;
const meal: Loadout = { food: "food_home_meal", gear: null };
function depart(state: GameState, loadout = meal) {
  const packed = prepareTrip(state, loadout, state.lastSeenAt + 1);
  return advanceGame(packed, packed.departureAt!);
}
function finish(state: GameState) { return advanceGame(state, state.trip!.returnsAt); }

test("田坝每趟带回本地一件，红苕原料不会加入吃食库存", () => {
  let state = newGame(now, 34);
  for (let i = 0; i < 40; i++) state = finish(depart(state));
  const trips = state.completed.filter(t => t.routeId === "route_tianba");
  assert.ok(trips.length > 3);
  const gifts = SOUVENIRS.filter(s => s.routeId === "route_tianba").map(s => s.id);
  assert.equal(new Set(trips.map(t => t.souvenirId)).size, 3);
  assert.ok(trips.every(t => gifts.includes(t.souvenirId)));
  assert.equal(state.souvenirCount, 40);
  assert.equal(state.inventory.food_sweet_potato_congee, 0);
});

test("红苕见闻只按出发快照触发，库存耗完/途中添购不会改变已定结果", () => {
  let found = false;
  for (let seed = 1; seed <= 16 && !found; seed++) {
    let state = finish(depart(newGame(now, seed)));
    for (let i = 0; i < 12; i++) {
      state = buyItem(state, "food_sweet_potato_congee", state.lastSeenAt);
      const out = depart(state, { food: "food_sweet_potato_congee", gear: null });
      assert.equal(out.inventory.food_sweet_potato_congee, 0);
      const bought = buyItem(out, "food_sweet_potato_congee", out.lastSeenAt);
      assert.deepEqual(bought.trip, out.trip);
      if (out.trip!.cardId === "card_tianba_02") {
        found = true;
        assert.equal(out.trip!.routeId, "route_tianba");
        assert.equal(out.trip!.loadout.food, "food_sweet_potato_congee");
        const returned = finish(out);
        assert.ok(returned.unlockedCards.includes("card_tianba_02"));
        assert.ok(isGameState(returned));
        assert.deepEqual(finish(out).souvenirs, returned.souvenirs);
        break;
      }
      state = finish(out);
    }
  }
  assert.ok(found, "红苕条件卡必须可获得");
  assert.equal(routeWeights({ food: "food_sweet_potato_congee", gear: "gear_straw_hat" }).route_tianba, 3);
});

test("旧版圆石的收藏数量/历史/在途定向迁移，原文不变且不重发奖励", () => {
  let current = newGame(now, 71);
  for (let i = 0; i < 60; i++) current = finish(depart(current));
  let out = depart(current);
  while (out.trip!.souvenirId !== "souvenir_glass_panda") out = depart(finish(out));
  const old = JSON.parse(JSON.stringify(out));
  delete old.inventory.food_sweet_potato_congee;
  old.souvenirs.souvenir_pebble = old.souvenirs.souvenir_glass_panda;
  delete old.souvenirs.souvenir_glass_panda;
  for (const trip of [...old.completed, old.trip])
    if (trip.souvenirId === "souvenir_glass_panda") trip.souvenirId = "souvenir_pebble";
  const raw = JSON.stringify(old);
  const decoded = decodeSave(raw);
  assert.equal(decoded.migrated, true);
  assert.deepEqual(decoded.state, out);
  assert.equal(JSON.stringify(old), raw);
  const returned = finish(decoded.state);
  assert.equal(returned.souvenirCount, out.souvenirCount + 1);
  assert.equal(returned.souvenirs.souvenir_glass_panda, out.souvenirs.souvenir_glass_panda! + 1);
  assert.equal(decodeSave(JSON.stringify(returned)).migrated, false);
});

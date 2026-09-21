import test from "node:test";
import assert from "node:assert/strict";
import { GEARS, GEAR_NAMES, itemImage } from "./content";
import { advanceGame, cancelPreparation, newGame, prepareTrip, routeWeights, type Loadout } from "./engine";
import { decodeSave, isGameState } from "./storage";

const now = 1_800_000_000_000;
const legacyId = "gear_oilpaper_umbrella";
const bag: Loadout = { food: "food_home_meal", gear: legacyId };
const ownedSave = () => ({ ...newGame(now, 71), coins: 12, ownedGear: [legacyId] });

test("旧伞持有/预备档直接显示筒靴，不重买、不重置出发时间或改变路线倾向", () => {
  const owned = decodeSave(JSON.stringify(ownedSave()));
  assert.equal(owned.migrated, false);
  assert.deepEqual(owned.state.ownedGear, [legacyId]);
  assert.equal(GEARS.length, 6);
  assert.equal(GEAR_NAMES[legacyId], "筒靴鞋");
  assert.equal(GEARS.find(g => g.id === legacyId)!.price, 24);
  assert.equal(itemImage(legacyId), "/art/items/gear_rain_boots.webp");
  assert.deepEqual(owned.state, ownedSave());
  const packed = prepareTrip(owned.state, bag, now + 1);
  const restored = decodeSave(JSON.stringify(packed)).state;
  assert.deepEqual(restored, packed);
  assert.equal(prepareTrip(restored, bag, now + 2).departureAt, packed.departureAt);
  const cancelled = cancelPreparation(restored, now + 2);
  assert.equal(cancelled.coins, 12);
  assert.deepEqual(cancelled.ownedGear, [legacyId]);
  assert.deepEqual(routeWeights(bag), { route_daoming: 1, route_chengdu_tea: 1, route_huanglongxi: 2, route_tianba: 1 });
});

test("旧伞在途与历史快照原样接续，路线/卡/物不重抽且归来只结算一次", () => {
  const packed = prepareTrip(decodeSave(JSON.stringify(ownedSave())).state, bag, now + 1);
  const traveling = advanceGame(packed, packed.departureAt!);
  const restored = decodeSave(JSON.stringify(traveling));
  assert.equal(restored.migrated, false);
  assert.deepEqual(restored.state, traveling);
  const returned = advanceGame(restored.state, restored.state.trip!.returnsAt);
  assert.ok(isGameState(returned));
  assert.equal(returned.coins, 8);
  assert.equal(returned.souvenirCount, 1);
  assert.deepEqual(returned.completed[0], traveling.trip);
  assert.deepEqual(returned.ownedGear, [legacyId]);
  const historical = decodeSave(JSON.stringify(returned)).state;
  assert.deepEqual(historical, returned);
  const revisited = advanceGame(historical, historical.lastSeenAt + 86_400_000);
  assert.equal(revisited.coins, 8);
  assert.equal(revisited.souvenirCount, 1);
  assert.deepEqual(revisited.completed, returned.completed);
});

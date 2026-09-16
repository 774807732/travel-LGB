import test from "node:test";
import assert from "node:assert/strict";
import { CARDS, FOODS, GEARS, ROUTES, SOUVENIRS, cardImage, souvenirsForCard } from "./content";
import { advanceGame, prepareTrip } from "./engine";
import { decodeSave, exportGame, isGameState } from "./storage";
import { sixteenCardSave } from "./fixtures/sixteen-card-save";

const cameo = CARDS.filter((c) => c.categoryId === "category_jojo");
const meal = { food: "food_home_meal", gear: null } as const;

test("叫叫为跨原四地的彩蛋分类，不增目的地、吃食、用具或出游条件", () => {
  assert.equal(ROUTES.length, 4);
  assert.equal(FOODS.length, 4);
  assert.equal(GEARS.length, 3);
  assert.equal(cameo.length, 4);
  assert.deepEqual(cameo.map((c) => c.routeId), ROUTES.map((r) => r.id));
  assert.ok(CARDS.slice(0, 16).every((c) => !c.categoryId));
  for (const c of cameo) {
    assert.equal(c.requiredFood, undefined);
    assert.equal(cardImage(c.id), `/art/cards/${c.id}.webp?v=jojo-v1`);
  }
});

test("两件专属收藏只在对应彩蛋奖池，其余见闻仍为原地点三物", () => {
  assert.deepEqual(souvenirsForCard("card_jojo_01").map((s) => s.id), ["souvenir_caterpillar"]);
  assert.deepEqual(souvenirsForCard("card_jojo_02").map((s) => s.id), ["souvenir_wanza_noodles"]);
  for (const c of CARDS.filter((c) => !c.souvenirId)) {
    const pool = souvenirsForCard(c.id);
    assert.equal(pool.length, 3);
    assert.ok(pool.every((s) => s.routeId === c.routeId && !["souvenir_caterpillar", "souvenir_wanza_noodles"].includes(s.id)));
  }
});

test("旧十六卡/十二物导入原样保留，不自动解锁彩蛋、不自动发奖", () => {
  const old = sixteenCardSave();
  assert.equal(old.unlockedCards.length, 16);
  assert.equal(Object.keys(old.souvenirs).length, 12);
  assert.ok(isGameState(old));
  const restored = decodeSave(exportGame(old));
  assert.equal(restored.migrated, false);
  assert.deepEqual(restored.state, old);
  const refreshed = advanceGame(restored.state, old.lastSeenAt + 86400000);
  assert.deepEqual(refreshed.cardCollection, old.cardCollection);
  assert.deepEqual(refreshed.souvenirs, old.souvenirs);
  assert.equal(refreshed.coins, old.coins);
});

test("旧十六卡的在途时间/结果不重抽，原纪念物正常发一次", () => {
  const state = sixteenCardSave();
  const pending = state.completed.pop()!;
  delete state.cardCollection[pending.cardId];
  state.unlockedCards = state.unlockedCards.filter((id) => id !== pending.cardId);
  state.souvenirs[pending.souvenirId]!--;
  state.souvenirCount--;
  state.coins -= 8;
  state.lastSeenAt = pending.departedAt;
  state.phase = "traveling";
  state.bag = pending.loadout;
  state.trip = pending;
  const restored = decodeSave(exportGame(state)).state;
  assert.deepEqual(advanceGame(restored, pending.letterAt - 1).trip, pending);
  const end = advanceGame(restored, pending.returnsAt);
  assert.equal(end.unlockedCards.length, 16);
  assert.deepEqual(end.completed.at(-1), pending);
  assert.deepEqual(advanceGame(end, pending.returnsAt + 1).souvenirs, end.souvenirs);
});

test("20 种子旧满档自然获得四彩蛋及两新物，每趟只一件且来信/归来/导入重放不重奖", () => {
  for (let seed = 1; seed <= 20; seed++) {
    let state = sixteenCardSave();
    state.seed = seed;
    for (let n = 0; n < 60 && state.unlockedCards.length < 20; n++) {
      const packed = prepareTrip(state, meal, state.lastSeenAt + 1);
      const wait = packed.departureAt! - state.lastSeenAt - 1;
      assert.ok(wait >= 120000 && wait <= 300000);
      const out = advanceGame(packed, packed.departureAt!);
      const trip = out.trip!;
      const next = cameo.find((c) => c.routeId === trip.routeId)!;
      if (!state.unlockedCards.includes(next.id)) assert.equal(trip.cardId, next.id);
      const duration = trip.returnsAt - trip.departedAt;
      assert.ok(duration >= 3600000 && duration <= 14400000);
      assert.equal(trip.letterAt - trip.departedAt, Math.floor(duration / 2));
      if (next.souvenirId && trip.cardId === next.id) assert.equal(trip.souvenirId, next.souvenirId);
      const letter = advanceGame(decodeSave(exportGame(out)).state, trip.letterAt);
      assert.ok(letter.unlockedCards.includes(trip.cardId));
      assert.deepEqual(letter.souvenirs, state.souvenirs);
      assert.equal(letter.coins, state.coins);
      const returned = advanceGame(decodeSave(exportGame(letter)).state, trip.returnsAt);
      assert.equal(returned.coins, state.coins + 8);
      assert.equal(returned.souvenirCount, state.souvenirCount + 1);
      assert.equal(Object.values(returned.souvenirs).reduce((a, b) => a + b, 0), returned.completed.length);
      const again = advanceGame(decodeSave(exportGame(returned)).state, trip.returnsAt);
      assert.deepEqual(again, returned);
      state = returned;
    }
    assert.equal(state.unlockedCards.length, 20);
    assert.equal(Object.keys(state.souvenirs).length, SOUVENIRS.length);
    assert.deepEqual(decodeSave(exportGame(state)).state, state);
  }
});

test("导入拒绝跨见闻挪用新收藏，旧纪念物的所有原卡组合仍兼容", () => {
  const old = sixteenCardSave();
  const invalid = structuredClone(old);
  invalid.completed[0].souvenirId = "souvenir_caterpillar";
  invalid.souvenirs.souvenir_bamboo_mat!--;
  invalid.souvenirs.souvenir_caterpillar = 1;
  assert.equal(isGameState(invalid), false);
  assert.throws(() => decodeSave(exportGame(invalid)));
  for (const card of CARDS.filter((c) => !c.categoryId)) {
    assert.equal(souvenirsForCard(card.id).length, 3);
  }
});

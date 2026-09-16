import test from "node:test";
import assert from "node:assert/strict";
import { CARDS, ROUTES, cardImage } from "./content";
import { advanceGame, prepareTrip } from "./engine";
import { decodeSave, exportGame, isGameState, DEBUG_SAVE_KEY, SAVE_KEY } from "./storage";
import { twelveCardSave } from "./fixtures/twelve-card-save";

const meal = { food: "food_home_meal", gear: null } as const;
const fourth = CARDS.filter((c) => !c.categoryId && c.id.endsWith("_04"));

test("第四卡均为普通见闻，配套图路径独立，原十二卡缓存路径不变", () => {
  assert.equal(fourth.length, 4);
  for (const route of ROUTES) {
    const cards = fourth.filter((c) => c.routeId === route.id);
    assert.equal(cards.length, 1);
    assert.equal(cards[0].requiredFood, undefined);
    assert.ok(cards[0].title && cards[0].text && cards[0].note);
    assert.equal(cardImage(cards[0].id), `/art/cards/${cards[0].id}.webp?v=fourth-v1`);
  }
  for (const c of CARDS.filter((c) => !c.categoryId && !c.id.endsWith("_04")))
    assert.equal(cardImage(c.id), `/art/cards/${c.id}.webp?v=clean-v2`);
});

test("旧十二卡满图鉴导入原样接续，不自动解锁新卡、不迁移或重发奖励", () => {
  const old = twelveCardSave();
  assert.equal(old.unlockedCards.length, 12);
  assert.ok(isGameState(old));
  const decoded = decodeSave(exportGame(old));
  assert.equal(decoded.migrated, false);
  assert.deepEqual(decoded.state, old);
  assert.equal(decoded.state.version, 2);
  assert.equal(SAVE_KEY, "travel-toad:v1");
  assert.equal(DEBUG_SAVE_KEY, "travel-toad:review:v1");
  const refreshed = advanceGame(decoded.state, old.lastSeenAt + 86400000);
  assert.deepEqual(refreshed.unlockedCards, old.unlockedCards);
  assert.deepEqual(refreshed.cardCollection, old.cardCollection);
  assert.deepEqual(refreshed.souvenirs, old.souvenirs);
  assert.equal(refreshed.coins, old.coins);
});

test("旧在途结果与时间不重抽，返家后才有机会取得第四卡", () => {
  const history = twelveCardSave();
  const pending = structuredClone(history.completed.at(-1)!);
  history.completed.pop();
  delete history.cardCollection[pending.cardId];
  history.unlockedCards = history.unlockedCards.filter((id) => id !== pending.cardId);
  history.souvenirs[pending.souvenirId]!--;
  history.souvenirCount--;
  history.coins -= 8;
  history.lastSeenAt = pending.departedAt;
  history.phase = "traveling";
  history.bag = pending.loadout;
  history.trip = pending;
  const decoded = decodeSave(exportGame(history));
  assert.equal(decoded.migrated, false);
  assert.deepEqual(advanceGame(decoded.state, pending.letterAt - 1).trip, pending);
  const returned = advanceGame(decoded.state, pending.returnsAt);
  assert.deepEqual(returned.completed.at(-1), pending);
  assert.equal(returned.unlockedCards.length, 12);
  assert.deepEqual(advanceGame(returned, pending.returnsAt).souvenirs, returned.souvenirs);
});

test("四地新卡按未见优先获得，来信/归来及导出导入后刷新各只结算一次", () => {
  let state = twelveCardSave();
  const oldTrips = structuredClone(state.completed);
  const awarded = new Set<string>();
  for (let n = 0; n < 60 && awarded.size < 4; n++) {
    const packed = prepareTrip(state, meal, state.lastSeenAt + 1);
    const out = advanceGame(packed, packed.departureAt!);
    const trip = out.trip!;
    const newCard = fourth.find((c) => c.routeId === trip.routeId)!;
    const unseen = CARDS.filter((c) => c.routeId === trip.routeId && !c.requiredFood && !state.unlockedCards.includes(c.id));
    if (unseen.length) assert.ok(unseen.some((c) => c.id === trip.cardId));
    assert.deepEqual(decodeSave(exportGame(out)).state, out);
    assert.ok(trip.returnsAt - trip.departedAt >= 3600000);
    assert.ok(trip.returnsAt - trip.departedAt <= 14400000);
    const letter = advanceGame(decodeSave(exportGame(out)).state, trip.letterAt);
    assert.ok(letter.unlockedCards.includes(trip.cardId));
    assert.equal(letter.souvenirCount, state.souvenirCount);
    assert.deepEqual(advanceGame(letter, trip.letterAt).cardCollection, letter.cardCollection);
    const returned = advanceGame(decodeSave(exportGame(letter)).state, trip.returnsAt);
    assert.equal(returned.coins, state.coins + 8);
    assert.equal(returned.souvenirCount, state.souvenirCount + 1);
    assert.deepEqual(decodeSave(exportGame(returned)).state, returned);
    const refreshed = advanceGame(decodeSave(exportGame(returned)).state, trip.returnsAt + 1);
    assert.deepEqual(refreshed.cardCollection, returned.cardCollection);
    assert.deepEqual(refreshed.souvenirs, returned.souvenirs);
    assert.equal(refreshed.coins, returned.coins);
    if (trip.cardId === newCard.id) awarded.add(trip.cardId);
    state = returned;
  }
  assert.equal(awarded.size, 4);
  assert.ok(CARDS.filter((c) => !c.categoryId).every((c) => state.unlockedCards.includes(c.id)));
  assert.ok(state.unlockedCards.length >= 16 && state.unlockedCards.length <= 20);
  assert.deepEqual(state.completed.slice(0, 12), oldTrips);
});

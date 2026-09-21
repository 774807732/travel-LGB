import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile } from "node:fs/promises";
import { HomeDisplayEditor } from "../components/HomeDisplayEditor";
import { SOUVENIRS, type SouvenirId } from "./content";
import { advanceGame, newGame, prepareTrip } from "./engine";
import { DISPLAY_SLOTS, homeDisplay, placeSouvenir, type DisplaySlotId } from "./homeDisplay";
import { decodeSave, exportGame, isGameState, loadGame, saveGame } from "./storage";
import { sixteenCardSave } from "./fixtures/sixteen-card-save";

const now = 1_800_000_000_000;
const old = () => sixteenCardSave(now - 86400000);
const emptyDisplay = { shelfTop: null, shelfLower: null };
const first = "souvenir_bamboo_mat";

test("旧档不改格式/奖励：未布置时沿用最近纪念物，新档两处空着", () => {
  const state = old(), copy = structuredClone(state);
  assert.deepEqual(homeDisplay(state), { ...emptyDisplay, shelfTop: state.completed.at(-1)!.souvenirId });
  assert.deepEqual(state, copy);
  assert.deepEqual(decodeSave(exportGame(state)), { state, migrated: false });
  assert.deepEqual(homeDisplay(newGame(now)), emptyDisplay);
});

test("摆放、替换、搬动、重复点击、收回均不扣收藏/盘缠，不修改输入", () => {
  const state = old(), copy = structuredClone(state);
  const other = SOUVENIRS.find((s) => s.id !== first && state.souvenirs[s.id])!.id;
  const placed = placeSouvenir(state, "shelfTop", first, state.lastSeenAt);
  assert.deepEqual(state, copy);
  assert.equal(homeDisplay(placed).shelfTop, first);
  const repeated = placeSouvenir(placed, "shelfTop", first, state.lastSeenAt);
  assert.deepEqual(repeated, placed);
  const moved = placeSouvenir(placed, "shelfLower", first, state.lastSeenAt);
  assert.equal(homeDisplay(moved).shelfTop, null);
  assert.equal(homeDisplay(moved).shelfLower, first);
  const swapped = placeSouvenir(moved, "shelfLower", other, state.lastSeenAt);
  assert.equal(homeDisplay(swapped).shelfLower, other);
  const removed = placeSouvenir(swapped, "shelfLower", null, state.lastSeenAt);
  assert.equal(homeDisplay(removed).shelfLower, null);
  const { homeDisplay: _display, ...rest } = removed;
  assert.deepEqual(rest, state);
  assert.ok(isGameState(removed));
});

test("两处可同时摆放，14种纪念物使用同一规则（含猪儿虫和豌杂面）", () => {
  // 摆放规则只读库存；完整存档历史由下面的导入测试单独覆盖。
  const state = { ...newGame(now), souvenirs: Object.fromEntries(SOUVENIRS.map((s) => [s.id, 1])) };
  for (const souvenir of SOUVENIRS) {
    const placed = placeSouvenir(state, "shelfTop", souvenir.id, now);
    assert.equal(homeDisplay(placed).shelfTop, souvenir.id);
    assert.deepEqual(placed.souvenirs, state.souvenirs);
  }
  let placed = old();
  DISPLAY_SLOTS.forEach((slot, i) => { placed = placeSouvenir(placed, slot.id, SOUVENIRS[i].id, placed.lastSeenAt); });
  assert.equal(new Set(Object.values(homeDisplay(placed))).size, 2);
  assert.ok(isGameState(placed));
});

test("拒绝未获得、未知物品与未知摆位；空档仍可收空位", () => {
  const state = newGame(now);
  assert.throws(() => placeSouvenir(state, "shelfTop", first, now), /带回/);
  assert.throws(() => placeSouvenir(state, "shelfTop", "bad" as SouvenirId, now), /带回/);
  assert.throws(() => placeSouvenir(state, "bad" as DisplaySlotId, null, now), /不能摆放/);
  assert.deepEqual(homeDisplay(placeSouvenir(state, "shelfTop", null, now)), emptyDisplay);
});

test("旧档全部收空后刷新/归来不会重新摆回最新礼物；出游仍只结算一次", () => {
  const state = old();
  const clear = placeSouvenir(state, "shelfTop", null, state.lastSeenAt);
  assert.deepEqual(homeDisplay(decodeSave(exportGame(clear)).state), emptyDisplay);
  const packed = prepareTrip(clear, { food: "food_home_meal", gear: null }, clear.lastSeenAt);
  const traveling = advanceGame(packed, packed.departureAt!);
  const edited = placeSouvenir(traveling, "shelfLower", first, traveling.lastSeenAt);
  const returned = advanceGame(edited, edited.trip!.returnsAt);
  assert.deepEqual(homeDisplay(returned), { ...emptyDisplay, shelfLower: first });
  assert.equal(returned.coins, clear.coins - 12 + 8);
  assert.equal(returned.souvenirCount, clear.souvenirCount + 1);
  assert.deepEqual(advanceGame(returned, returned.lastSeenAt), returned);
  assert.ok(isGameState(returned));
});

test("摆放存档导出/导入、保存/恢复和备份往返完整保留", () => {
  const state = old();
  const placed = placeSouvenir(state, "shelfTop", first, state.lastSeenAt);
  assert.deepEqual(decodeSave(exportGame(placed)).state, placed);
  const map = new Map<string, string>();
  const storage = { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value); } };
  saveGame(storage, "test", placed);
  assert.deepEqual(loadGame(storage, "test", now).state, placed);
  const clear = placeSouvenir(placed, "shelfTop", null, placed.lastSeenAt);
  saveGame(storage, "test", clear);
  assert.deepEqual(decodeSave(map.get("test:backup")!).state, placed);
});

test("导入严格拒绝残缺/未知摆位、重复/未获得/未知收藏与非法类型", () => {
  const state = old();
  for (const display of [
    null, [], {}, { shelfTop: first }, { ...emptyDisplay, surprise: null },
    { shelfTop: first, window: null },
    { ...emptyDisplay, shelfTop: first, shelfLower: first },
    { ...emptyDisplay, window: first, shelfTop: first },
    { ...emptyDisplay, window: "souvenir_caterpillar" },
    { ...emptyDisplay, window: "bad" }, { ...emptyDisplay, window: 7 },
  ]) {
    const invalid = { ...state, homeDisplay: display };
    assert.equal(isGameState(invalid), false);
    assert.throws(() => decodeSave(JSON.stringify(invalid)));
  }
});

test("编辑器不泄露未获得收藏；只读档可看摆位但禁用摆放/收回", () => {
  const props = { slot: "shelfTop" as const, onSlot: () => {}, onPlace: async () => true, onView: () => {}, canWrite: true };
  const empty = renderToStaticMarkup(createElement(HomeDisplayEditor, { ...props, state: newGame(now) }));
  assert.match(empty, /等它带回第一件纪念物/);
  for (const item of SOUVENIRS) assert.ok(!empty.includes(item.name));
  const readonly = renderToStaticMarkup(createElement(HomeDisplayEditor, { ...props, state: old(), canWrite: false }));
  assert.match(readonly, /<button disabled="">收回这件/);
  for (const button of readonly.matchAll(/<button[^>]*aria-label="摆放[^>]+>/g)) assert.match(button[0], /disabled=""/);
});

test("旧三摆位档仅收回窗边物：两层、库存、盘缠和旅程不变，迁移幂等", () => {
  const state = old();
  const shelves = { shelfTop: SOUVENIRS[0].id, shelfLower: SOUVENIRS[1].id };
  for (const window of [null, SOUVENIRS[2].id]) {
    const legacy = { ...state, homeDisplay: { ...shelves, window } };
    const original = structuredClone(legacy);
    const raw = exportGame(legacy);
    assert.ok(isGameState(legacy));
    assert.deepEqual(homeDisplay(legacy), shelves);
    const decoded = decodeSave(raw);
    assert.equal(decoded.migrated, true);
    assert.deepEqual(decoded.state, { ...state, homeDisplay: shelves });
    assert.deepEqual(legacy, original);
    assert.deepEqual(decodeSave(exportGame(decoded.state)), { state: decoded.state, migrated: false });
    const updated = placeSouvenir(decoded.state, "shelfLower", SOUVENIRS[2].id, state.lastSeenAt);
    assert.equal(homeDisplay(updated).shelfLower, SOUVENIRS[2].id);
    assert.deepEqual(updated.souvenirs, state.souvenirs);
  }
});

test("窗边柜不再有摆放入口或操作，编辑器只保留小格架两层", async () => {
  const state = old();
  assert.deepEqual(DISPLAY_SLOTS.map((s) => s.id), ["shelfTop", "shelfLower"]);
  assert.throws(() => placeSouvenir(state, "window" as DisplaySlotId, first, state.lastSeenAt), /不能摆放/);
  const html = renderToStaticMarkup(createElement(HomeDisplayEditor, {
    state, slot: "shelfTop", onSlot: () => {}, onPlace: async () => true, onView: () => {}, canWrite: true,
  }));
  assert.equal((html.match(/aria-label="选择小格架/g) ?? []).length, 2);
  assert.ok(!html.includes("窗边柜"));
  const css = await readFile("src/styles.css", "utf8");
  const app = await readFile("src/App.tsx", "utf8");
  assert.ok(!css.includes('.display-prop[data-slot="window"]'));
  assert.ok(!app.includes("窗边柜"));
  assert.match(css, /\.display-slots\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/);
});

test("家景监听就绪后同步当前尺寸，摆件缩小20%并按2.5D层板锚定", async () => {
  const app = await readFile("src/App.tsx", "utf8");
  const css = await readFile("src/styles.css", "utf8");
  const effect = app.slice(app.indexOf("const media = matchMedia(DESKTOP_MEDIA)"));
  assert.match(effect, /media\.addEventListener\("change", sync\);\s*\/\/[^\n]*\n\s*sync\(\);/);
  assert.match(css, /\.display-prop\s*\{[^}]*width: 44px;[^}]*height: 44px;/);
  assert.match(css, /\.display-prop \.item-art\s*\{[^}]*width: 80%;[^}]*height: 80%;/);
  assert.match(css, /\.display-prop\[data-slot="shelfTop"\]\s*\{ top: 69%; \}/);
  assert.match(css, /\.display-prop\[data-slot="shelfLower"\]\s*\{ top: 79%; \}/);
  assert.match(css, /\.scene\[data-layout="wide"\] \.display-prop\[data-slot="shelfTop"\]\s*\{ top: 72%; \}/);
  assert.match(css, /\.scene\[data-layout="wide"\] \.display-prop\[data-slot="shelfLower"\]\s*\{ top: 82\.5%; \}/);
  assert.match(css, /\.display-prop:active\s*\{\s*transform: translate\(-50%, -100%\) translateY\(1px\);/);
});

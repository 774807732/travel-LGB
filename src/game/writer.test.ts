import test from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import {
  createLeaseWriter, LEASE_MS, NotWriterError, openLeaseDatabase,
  READER_NOTICE, STORAGE_NOTICE, WriterUnavailableError, type WriterStatus,
} from "./writer";
import { harvest, newGame, buyItem, prepareTrip, advanceGame } from "./engine";
import { SAVE_KEY, DEBUG_SAVE_KEY, loadGame, saveGame } from "./storage";

function memory() {
  const data = new Map<string, string>();
  return { data, getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); } };
}
async function setup() {
  const factory = new IDBFactory();
  let time = 1800000000000;
  const writers: ReturnType<typeof createLeaseWriter>[] = [];
  async function tab(id: string, key = SAVE_KEY) {
    const status: WriterStatus[] = [];
    const db = await openLeaseDatabase(factory);
    const writer = createLeaseWriter(db, key, id, (s) => status.push(s), () => time);
    writers.push(writer);
    return { writer, status, db };
  }
  return { tab, now: () => time, advance: (ms: number) => { time += ms; },
    close: () => writers.forEach((w) => w.close()) };
}

test("HTTP 单窗口取得写权限；获取租约不改现有存档", async () => {
  const f = await setup();
  const s = memory();
  saveGame(s, SAVE_KEY, newGame(f.now()));
  const before = new Map(s.data);
  const a = await f.tab("a");
  await a.writer.poll();
  assert.deepEqual(a.status, ["owner"]);
  assert.deepEqual(s.data, before);
  await a.writer.run(() => saveGame(s, SAVE_KEY, harvest(loadGame(s, SAVE_KEY, f.now()).state, f.now())));
  assert.equal(loadGame(s, SAVE_KEY, f.now()).state.coins, 36);
  f.close();
});

test("二十个 HTTP 标签页同时打开，只有一个可写", async () => {
  const f = await setup();
  const tabs = await Promise.all(Array.from({ length: 20 }, (_, i) => f.tab(String(i))));
  await Promise.all(tabs.map((t) => t.writer.poll()));
  const writes: string[] = [];
  const results = await Promise.allSettled(tabs.map((t, i) => t.writer.run(() => writes.push(String(i)))));
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(writes.length, 1);
  assert.equal(tabs.filter((t) => t.status.at(-1) === "owner").length, 1);
  f.close();
});

test("正常存档与测试档分别协调，不互相占锁", async () => {
  const f = await setup();
  const a = await f.tab("a"), b = await f.tab("b", DEBUG_SAVE_KEY);
  await Promise.all([a.writer.poll(), b.writer.poll()]);
  assert.equal(a.status.at(-1), "owner");
  assert.equal(b.status.at(-1), "owner");
  f.close();
});

test("心跳续约阻止抢占；关闭原窗口后自动接续", async () => {
  const f = await setup();
  const a = await f.tab("a"), b = await f.tab("b");
  await a.writer.poll();
  f.advance(LEASE_MS - 1);
  await a.writer.poll();
  f.advance(2);
  await b.writer.poll();
  await assert.rejects(b.writer.run(() => assert.fail()), NotWriterError);
  a.writer.close();
  await b.writer.poll();
  assert.equal(b.status.at(-1), "owner");
  await assert.rejects(a.writer.run(() => assert.fail()), NotWriterError);
  f.close();
});

test("崩溃或休眠超过租约后接续；旧窗口不能覆盖新进度或释放新锁", async () => {
  const f = await setup();
  const a = await f.tab("a"), b = await f.tab("b"), c = await f.tab("c");
  const s = memory();
  saveGame(s, SAVE_KEY, newGame(f.now()));
  await a.writer.poll();
  const stale = loadGame(s, SAVE_KEY, f.now()).state;
  f.advance(LEASE_MS + 1);
  await b.writer.poll();
  await b.writer.run(() => saveGame(s, SAVE_KEY, harvest(loadGame(s, SAVE_KEY, f.now()).state, f.now())));
  const latest = s.getItem(SAVE_KEY);
  await assert.rejects(a.writer.run(() => saveGame(s, SAVE_KEY, stale)), NotWriterError);
  assert.equal(a.status.at(-1), "reader");
  a.writer.close();
  await c.writer.poll();
  await assert.rejects(c.writer.run(() => assert.fail()), NotWriterError);
  assert.equal(s.getItem(SAVE_KEY), latest);
  f.close();
});

test("无接替者时，过期租约也禁止直接写；重新取得后才能继续", async () => {
  const f = await setup();
  const a = await f.tab("a");
  await a.writer.poll();
  f.advance(LEASE_MS);
  await assert.rejects(a.writer.run(() => assert.fail()), NotWriterError);
  await a.writer.poll();
  assert.equal(await a.writer.run(() => 42), 42);
  f.close();
});

test("连续操作在排他事务内读最新档；收成不重复，采购与出发不丢失", async () => {
  const f = await setup();
  const a = await f.tab("a");
  const s = memory();
  saveGame(s, SAVE_KEY, newGame(f.now()));
  await a.writer.poll();
  const collect = () => a.writer.run(() => {
    const current = loadGame(s, SAVE_KEY, f.now()).state;
    saveGame(s, SAVE_KEY, harvest(current, f.now()));
  });
  await Promise.allSettled([collect(), collect(), collect()]);
  assert.equal(loadGame(s, SAVE_KEY, f.now()).state.coins, 36);
  await a.writer.run(() => {
    const current = loadGame(s, SAVE_KEY, f.now()).state;
    saveGame(s, SAVE_KEY, buyItem(current, "food_sweet_potato_congee", f.now()));
  });
  await a.writer.run(() => {
    const current = loadGame(s, SAVE_KEY, f.now()).state;
    const packed = prepareTrip(current, { food: "food_sweet_potato_congee", gear: null }, f.now());
    saveGame(s, SAVE_KEY, advanceGame(packed, packed.departureAt!));
  });
  const end = loadGame(s, SAVE_KEY, f.now()).state;
  assert.equal(end.coins, 16);
  assert.equal(end.phase, "traveling");
  assert.equal(end.inventory.food_sweet_potato_congee, 0);
  const repeatDeparture = () => a.writer.run(() => {
    const current = loadGame(s, SAVE_KEY, f.now()).state;
    saveGame(s, SAVE_KEY, advanceGame(current, end.lastSeenAt));
  });
  await Promise.all([repeatDeparture(), repeatDeparture(), repeatDeparture()]);
  assert.equal(loadGame(s, SAVE_KEY, f.now()).state.coins, 16);
  f.close();
});

test("游戏规则拒绝不误报存储故障，下一次有效操作仍成功", async () => {
  const f = await setup();
  const a = await f.tab("a");
  await a.writer.poll();
  await assert.rejects(a.writer.run(() => { throw new Error("盘缠不足"); }), /盘缠不足/);
  assert.equal(await a.writer.run(() => 1), 1);
  assert.deepEqual(a.status, ["owner"]);
  f.close();
});

test("IndexedDB 失效时禁止写入，提示与另一窗口占用不同", async () => {
  const f = await setup();
  const a = await f.tab("a");
  await a.writer.poll();
  a.db.close();
  await assert.rejects(a.writer.run(() => assert.fail()), WriterUnavailableError);
  assert.equal(a.status.at(-1), "unavailable");
  assert.match(STORAGE_NOTICE, /浏览器存储/);
  assert.doesNotMatch(STORAGE_NOTICE, /原窗口|另一窗口/);
  assert.match(READER_NOTICE, /另一窗口/);
  f.close();
});

test("只读标签读取坏档及备份不写任何数据；取得权限后保留坏档原文", () => {
  const s = memory();
  s.setItem(SAVE_KEY, "damaged");
  s.setItem(SAVE_KEY + ":backup", JSON.stringify(newGame(1800000000000)));
  const before = new Map(s.data);
  assert.equal(loadGame(s, SAVE_KEY, 1800000000000, true).recovered, true);
  assert.deepEqual(s.data, before);
  assert.equal(loadGame(s, SAVE_KEY, 1800000000000).recovered, true);
  assert.equal(s.getItem(SAVE_KEY + ":damaged"), "damaged");
});

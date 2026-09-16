// 只生成合成测试档；仅允许通过 ?debug=1 的导入入口试玩。
import { mkdir, writeFile } from "node:fs/promises";
import { advanceGame, newGame, prepareTrip } from "../src/game/engine";
import { exportGame, isGameState } from "../src/game/storage";
import { sixteenCardSave } from "../src/game/fixtures/sixteen-card-save";

const directory = "work/test-results/jojo";
await mkdir(directory, { recursive: true });
const old = sixteenCardSave(Date.now() - 3 * 86400000);
let full = old;
for (let seed = 1; seed <= 1000; seed++) {
  old.seed = seed;
  full = structuredClone(old);
  for (let n = 0; n < 4; n++) {
    const packed = prepareTrip(full, { food: "food_home_meal", gear: null }, full.lastSeenAt + 1);
    const out = advanceGame(packed, packed.departureAt!);
    full = advanceGame(out, out.trip!.returnsAt);
  }
  if (full.unlockedCards.length === 20) break;
}
if (full.unlockedCards.length !== 20) throw new Error("未找到四趟覆盖的测试种子");
for (const [name, state] of Object.entries({ empty: newGame(Date.now(), 71), "old-sixteen": old, "all-twenty": full })) {
  if (!isGameState(state)) throw new Error(`${name} 非法`);
  await writeFile(`${directory}/${name}.json`, exportGame(state));
  console.log(`${directory}/${name}.json：${state.unlockedCards.length}/20，${state.completed.length} 趟，${state.coins} 文`);
}
console.log("测试种子", old.seed, "后四趟", full.completed.slice(16).map((t) => ({ card: t.cardId, souvenir: t.souvenirId, duration: t.returnsAt - t.departedAt })));

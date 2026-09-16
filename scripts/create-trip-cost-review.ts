// 合成验收档；只写忽略的 work/test-results，通过 ?debug=1 的设置导入。
import { mkdir, writeFile } from "node:fs/promises";
import { newGame, type GameState } from "../src/game/engine";
import { exportGame, isGameState } from "../src/game/storage";
import { sixteenCardSave } from "../src/game/fixtures/sixteen-card-save";

const directory = "work/test-results/trip-cost";
const now = Date.now();
const normal = { ...sixteenCardSave(now - 3 * 86400000), coins: 20, lastSeenAt: now, harvestAt: now };
const legacyPacked: GameState = {
  ...newGame(now - 30000), coins: 0, phase: "packed",
  bag: { food: "food_yeerba", gear: null }, departureAt: now - 15000,
  inventory: { food_yeerba: 1, food_guokui: 0, food_sweet_potato_congee: 0 },
};
await mkdir(directory, { recursive: true });
for (const [name, state] of Object.entries({
  "normal-20": normal,
  "first-12": { ...newGame(now, 71), coins: 12 },
  "legacy-packed-0": legacyPacked,
})) {
  if (!isGameState(state)) throw new Error(`${name} 验收档不合法`);
  await writeFile(`${directory}/${name}.json`, exportGame(state));
  console.log(`${name}: ${state.coins} 文，${state.phase}`);
}

// 生成可从游戏设置导入的人工验收档，只写忽略的测试输出，不触碰浏览器存档。
// node --import tsx scripts/create-card-review.ts
import { mkdir, writeFile } from "node:fs/promises";
import { advanceGame, newGame, prepareTrip } from "../src/game/engine";
import { exportGame, isGameState } from "../src/game/storage";
import { twelveCardSave } from "../src/game/fixtures/twelve-card-save";

const directory = "work/test-results/fourth-cards";
await mkdir(directory, { recursive: true });
const old = twelveCardSave(Date.now() - 86400000);
// 固定测试种子便于在四趟内覆盖四地；不改变规则或正式玩家的随机数。
old.seed = 10;
let full = structuredClone(old);
for (let i = 0; i < 60 && full.unlockedCards.length < 16; i++) {
  const packed = prepareTrip(full, { food: "food_home_meal", gear: null }, full.lastSeenAt + 1);
  const out = advanceGame(packed, packed.departureAt!);
  full = advanceGame(out, out.trip!.returnsAt);
}
if (full.unlockedCards.length !== 16) throw new Error("未生成完整图鉴");
for (const [name, state] of Object.entries({ empty: newGame(Date.now(), 71), "old-twelve": old, "all-sixteen": full })) {
  if (!isGameState(state)) throw new Error(`${name} 验收档不合法`);
  await writeFile(`${directory}/${name}.json`, exportGame(state));
  console.log(`${directory}/${name}.json：${state.unlockedCards.length}/16，${state.completed.length} 趟`);
}
console.log("仅导入 ?debug=1，正常档勿动；旧十二卡之后的模拟结果：", full.completed.slice(12).map((t) => t.cardId));

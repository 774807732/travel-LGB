// 生成可从游戏设置导入的人工验收档，只写忽略的测试输出，不触碰浏览器存档。
// node --import tsx scripts/create-card-review.ts
import { mkdir, writeFile } from "node:fs/promises";
import { newGame } from "../src/game/engine";
import { exportGame, isGameState } from "../src/game/storage";
import { twelveCardSave } from "../src/game/fixtures/twelve-card-save";
import { sixteenCardSave } from "../src/game/fixtures/sixteen-card-save";

const directory = "work/test-results/fourth-cards";
await mkdir(directory, { recursive: true });
const old = twelveCardSave(Date.now() - 86400000);
// 新增叫叫后旧版 all-sixteen 仍只含原十六卡，不混入新彩蛋。
for (const [name, state] of Object.entries({ empty: newGame(Date.now(), 71), "old-twelve": old, "all-sixteen": sixteenCardSave(Date.now() - 3 * 86400000) })) {
  if (!isGameState(state)) throw new Error(`${name} 验收档不合法`);
  await writeFile(`${directory}/${name}.json`, exportGame(state));
  console.log(`${directory}/${name}.json：原版 ${state.unlockedCards.length} 张，${state.completed.length} 趟`);
}
console.log("仅导入 ?debug=1，正常档勿动；叫叫四趟验收改用 create-jojo-review.ts。");

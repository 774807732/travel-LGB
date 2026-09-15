// 人工构造的旧十二卡测试档；不读取玩家数据，不进入应用运行入口。
import { CARDS, SOUVENIRS } from "../content";
import { advanceGame, newGame, type GameState } from "../engine";

export function twelveCardSave(now = 1_800_000_000_000): GameState {
  let state = newGame(now, 71);
  for (const card of CARDS.filter((c) => !c.id.endsWith("_04"))) {
    const number = state.nextTripNumber;
    const departedAt = state.lastSeenAt + 1000;
    const loadout = { food: card.requiredFood ?? "food_home_meal", gear: null } as const;
    state = advanceGame({
      ...state,
      phase: "traveling",
      bag: loadout,
      tutorialStarted: true,
      nextTripNumber: number + 1,
      trip: {
        id: `trip_${number}`, number, loadout, seed: number,
        departedAt, letterAt: departedAt + 45000, returnsAt: departedAt + 90000,
        routeId: card.routeId, cardId: card.id,
        souvenirId: SOUVENIRS.find((s) => s.routeId === card.routeId)!.id,
      },
    }, departedAt + 90000);
  }
  return state;
}

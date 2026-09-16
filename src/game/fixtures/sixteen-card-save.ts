// 人工旧版满图鉴：只含原十六卡/十二物，不读取玩家存档。
import { CARDS, souvenirsForCard } from "../content";
import { advanceGame, newGame, type GameState } from "../engine";

export function sixteenCardSave(now = 1_800_000_000_000): GameState {
  let state = newGame(now, 71);
  const routeVisits = new Map<string, number>();
  for (const card of CARDS.filter((c) => !c.categoryId)) {
    const number = state.nextTripNumber;
    const departedAt = state.lastSeenAt + 1000;
    const loadout = { food: card.requiredFood ?? "food_home_meal", gear: null } as const;
    const pool = souvenirsForCard(card.id);
    const visits = routeVisits.get(card.routeId) ?? 0;
    routeVisits.set(card.routeId, visits + 1);
    state = advanceGame({
      ...state, phase: "traveling", bag: loadout, tutorialStarted: true,
      nextTripNumber: number + 1,
      trip: {
        id: `trip_${number}`, number, loadout, seed: number,
        departedAt, letterAt: departedAt + 1800000, returnsAt: departedAt + 3600000,
        routeId: card.routeId, cardId: card.id, souvenirId: pool[visits % pool.length].id,
      },
    }, departedAt + 3600000);
  }
  return state;
}

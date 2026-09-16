import { HARVEST_INTERVAL, TRIP_COST, harvest, type GameState } from "../engine";

// 长程规则测试通过正常收成攒路费，不直接发钱或绕过出发收费。
export function withTravelBudget(input: GameState, minimum = TRIP_COST): GameState {
  let state = input;
  while (state.coins < minimum)
    state = harvest(state, Math.max(state.lastSeenAt, state.harvestAt + HARVEST_INTERVAL));
  return state;
}

import {
  CARDS,
  FOODS,
  GEARS,
  ROUTES,
  SOUVENIRS,
  FOOD_NAMES,
  GEAR_NAMES,
  type FoodId,
  type GearId,
  type RouteId,
  type CardId,
  type SouvenirId,
} from "./content";
export { FOOD_NAMES, GEAR_NAMES };
export type { FoodId, GearId };
export type Phase = "home" | "packed" | "traveling";
export type Loadout = { food: FoodId; gear: GearId | null };
export type Trip = {
  id: string;
  number: number;
  loadout: Loadout;
  departedAt: number;
  letterAt: number;
  returnsAt: number;
  routeId: RouteId;
  cardId: CardId;
  souvenirId: SouvenirId;
  seed: number;
};
export type CardRecord = { count: number; firstAt: number; lastAt: number };
export type GameState = {
  version: 2;
  phase: Phase;
  coins: number;
  lastSeenAt: number;
  createdAt: number;
  seed: number;
  inventory: Record<Exclude<FoodId, "food_home_meal">, number>;
  ownedGear: GearId[];
  bag: Loadout | null;
  departureAt: number | null;
  trip: Trip | null;
  completed: Trip[];
  nextTripNumber: number;
  tutorialStarted: boolean;
  unlockedCards: CardId[];
  cardCollection: Partial<Record<CardId, CardRecord>>;
  readLetters: string[];
  souvenirCount: number;
  souvenirs: Partial<Record<SouvenirId, number>>;
  hasUnreadReturn: boolean;
  reducedMotion: boolean;
  soundEnabled: boolean;
  scene: "home" | "yard";
  harvestAt: number;
};
export const HARVEST_INTERVAL = 4 * 60 * 60 * 1000;
export const HARVEST_CAP = 3;
export const CARD = { ...CARDS[0], place: "道明竹乡" }; // 兼容早期原型引用。
export function newGame(now: number, seed = hashSeed(now)): GameState {
  return {
    version: 2,
    phase: "home",
    coins: 24,
    lastSeenAt: now,
    createdAt: now,
    seed: seed >>> 0,
    inventory: { food_yeerba: 0, food_guokui: 0, food_sweet_potato_congee: 0 },
    ownedGear: [],
    bag: null,
    departureAt: null,
    trip: null,
    completed: [],
    nextTripNumber: 1,
    tutorialStarted: false,
    unlockedCards: [],
    cardCollection: {},
    readLetters: [],
    souvenirCount: 0,
    souvenirs: {},
    hasUnreadReturn: false,
    reducedMotion: false,
    soundEnabled: false,
    scene: "home",
    // 开局有一份晒好的收成，让第一次逛院坝就能试着收取。
    harvestAt: Math.max(0, now - HARVEST_INTERVAL),
  };
}
export function hashSeed(value: number): number {
  let n = value >>> 0;
  n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
  n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
  return (n ^ (n >>> 16)) >>> 0;
}
function random(seed: number) {
  let n = seed;
  return () => {
    n += 0x6d2b79f5;
    let t = n;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function validTime(state: GameState, now: number) {
  return Number.isFinite(now)
    ? Math.max(state.lastSeenAt, now)
    : state.lastSeenAt;
}
export function routeWeights(
  loadout: Loadout,
  recent: RouteId[] = [],
): Record<RouteId, number> {
  const weights: Record<RouteId, number> = {
    route_daoming: 1,
    route_chengdu_tea: 1,
    route_huanglongxi: 1,
    route_tianba: 1,
  };
  if (loadout.food === "food_yeerba") weights.route_daoming++;
  if (loadout.food === "food_guokui") weights.route_chengdu_tea++;
  if (loadout.food === "food_sweet_potato_congee") weights.route_tianba++;
  if (loadout.gear === "gear_bamboo_flask") weights.route_daoming++;
  if (loadout.gear === "gear_oilpaper_umbrella") weights.route_huanglongxi++;
  if (loadout.gear === "gear_straw_hat") weights.route_tianba++;
  if (recent.length >= 2 && recent.at(-1) === recent.at(-2))
    weights[recent.at(-1)!] = 0;
  return weights;
}
function tripResult(state: GameState, loadout: Loadout, seed: number) {
  if (!state.tutorialStarted)
    return {
      routeId: "route_daoming" as RouteId,
      cardId: "card_daoming_01" as CardId,
      souvenirId: "souvenir_bamboo_mat" as SouvenirId,
      duration: 90000,
    };
  const rng = random(seed);
  const weights = routeWeights(
    loadout,
    state.completed.slice(-2).map((t) => t.routeId),
  );
  let point = rng() * Object.values(weights).reduce((a, b) => a + b, 0);
  let routeId: RouteId = "route_huanglongxi";
  for (const route of ROUTES) {
    point -= weights[route.id];
    if (point < 0) {
      routeId = route.id;
      break;
    }
  }
  // 先按本趟出发快照筛选条件卡，再执行未见优先；不能使用剩余库存判断。
  const cards = CARDS.filter((c) => c.routeId === routeId && (!c.requiredFood || c.requiredFood === loadout.food));
  const unseen = cards.filter((c) => !state.unlockedCards.includes(c.id));
  const cardPool = unseen.length ? unseen : cards;
  const souvenirs = SOUVENIRS.filter((s) => s.routeId === routeId);
  const ungathered = souvenirs.filter((s) => !state.souvenirs[s.id]);
  const souvenirPool = ungathered.length ? ungathered : souvenirs;
  return {
    routeId,
    cardId: cardPool[Math.floor(rng() * cardPool.length)].id,
    souvenirId: souvenirPool[Math.floor(rng() * souvenirPool.length)].id,
    duration: (3600 + Math.floor(rng() * 10801)) * 1000,
  };
}
export function availableLetters(state: GameState): Trip[] {
  return [
    ...state.completed,
    ...(state.trip && state.lastSeenAt >= state.trip.letterAt
      ? [state.trip]
      : []),
  ];
}
export function availableHarvests(
  state: GameState,
  now = state.lastSeenAt,
): number {
  return Math.min(
    HARVEST_CAP,
    Math.max(
      0,
      Math.floor((validTime(state, now) - state.harvestAt) / HARVEST_INTERVAL),
    ),
  );
}
export function advanceGame(input: GameState, requestedNow: number): GameState {
  const now = validTime(input, requestedNow);
  const state = structuredClone(input);
  state.lastSeenAt = now;
  if (
    state.phase === "packed" &&
    state.departureAt !== null &&
    now >= state.departureAt &&
    state.bag
  ) {
    const start = state.departureAt;
    const seed = hashSeed(state.seed ^ state.nextTripNumber);
    const result = tripResult(state, state.bag, seed);
    state.trip = {
      id: "trip_" + state.nextTripNumber,
      number: state.nextTripNumber,
      loadout: { ...state.bag },
      departedAt: start,
      letterAt: start + result.duration / 2,
      returnsAt: start + result.duration,
      routeId: result.routeId,
      cardId: result.cardId,
      souvenirId: result.souvenirId,
      seed,
    };
    if (state.bag.food !== "food_home_meal") state.inventory[state.bag.food]--;
    state.nextTripNumber++;
    state.tutorialStarted = true;
    state.phase = "traveling";
    state.departureAt = null;
  }
  if (state.trip && now >= state.trip.letterAt) {
    const trip = state.trip;
    const existing = state.cardCollection[trip.cardId];
    // 每封来信的时间都是唯一、递增的事件边界，重复推进不会增加获得次数。
    if (!existing || existing.lastAt < trip.letterAt) {
      state.cardCollection[trip.cardId] = {
        count: (existing?.count ?? 0) + 1,
        firstAt: existing?.firstAt ?? trip.letterAt,
        lastAt: trip.letterAt,
      };
      if (!state.unlockedCards.includes(trip.cardId))
        state.unlockedCards.push(trip.cardId);
    }
  }
  if (state.trip && now >= state.trip.returnsAt) {
    if (!state.completed.some((t) => t.id === state.trip!.id)) {
      state.completed.push(state.trip);
      state.coins += 8;
      state.souvenirs[state.trip.souvenirId] =
        (state.souvenirs[state.trip.souvenirId] ?? 0) + 1;
      state.souvenirCount++;
      state.hasUnreadReturn = true;
    }
    state.trip = null;
    state.bag = null;
    state.phase = "home";
  }
  return state;
}
export function prepareTrip(
  input: GameState,
  loadout: Loadout,
  now: number,
): GameState {
  const state = advanceGame(input, now);
  if (state.phase === "traveling") throw new Error("已经出发了，回来再收拾。");
  if (!Object.hasOwn(FOOD_NAMES, loadout.food))
    throw new Error("先装一份吃食。");
  if (loadout.food !== "food_home_meal" && state.inventory[loadout.food] < 1)
    throw new Error("这份吃食没有库存，可选免费的家常饭。");
  if (loadout.gear !== null && !state.ownedGear.includes(loadout.gear))
    throw new Error("还没有这个用具。");
  if (
    state.phase === "packed" &&
    state.bag?.food === loadout.food &&
    state.bag.gear === loadout.gear
  )
    return state;
  state.bag = { ...loadout };
  state.phase = "packed";
  const wait = state.tutorialStarted
    ? (120 +
        Math.floor(
          random(hashSeed(state.seed + state.nextTripNumber))() * 181,
        )) *
      1000
    : 15000;
  state.departureAt = state.lastSeenAt + wait;
  return state;
}
export function cancelPreparation(input: GameState, now: number): GameState {
  const state = advanceGame(input, now);
  if (state.phase !== "packed")
    throw new Error(
      state.phase === "traveling"
        ? "已经出发，这趟不能取消了。"
        : "还没有备好的行囊。",
    );
  state.phase = "home";
  state.bag = null;
  state.departureAt = null;
  return state;
}
export function markLetterRead(
  input: GameState,
  tripId: string,
  now: number,
): GameState {
  const state = advanceGame(input, now);
  if (
    availableLetters(state).some((t) => t.id === tripId) &&
    !state.readLetters.includes(tripId)
  )
    state.readLetters.push(tripId);
  return state;
}
export function buyItem(
  input: GameState,
  id: FoodId | GearId,
  now: number,
): GameState {
  const state = advanceGame(input, now);
  if (id === "food_home_meal")
    throw new Error("家常饭不用买，直接装进行囊就好。");
  const item = [...FOODS, ...GEARS].find((x) => x.id === id);
  if (!item) throw new Error("小铺里没有这件东西。");
  if (state.coins < item.price)
    throw new Error("盘缠不够，先带一份免费的家常饭吧。");
  if (GEARS.some((x) => x.id === id)) {
    if (state.ownedGear.includes(id as GearId))
      throw new Error("这个用具已经有了，不用再买。");
    state.ownedGear.push(id as GearId);
  } else {
    const food = id as Exclude<FoodId, "food_home_meal">;
    if (state.inventory[food] >= 99)
      throw new Error("已经备了不少吃的，先用一些吧。");
    state.inventory[food]++;
  }
  state.coins -= item.price;
  return state;
}
export function harvest(input: GameState, now: number): GameState {
  const state = advanceGame(input, now);
  const count = availableHarvests(state);
  if (count === 0) throw new Error("还在慢慢晒着，晚点再来看看。");
  state.coins += count * 12;
  state.harvestAt =
    count === HARVEST_CAP
      ? state.lastSeenAt
      : state.harvestAt + count * HARVEST_INTERVAL;
  return state;
}
export function nextEventAt(state: GameState): number | null {
  if (state.phase === "packed") return state.departureAt;
  if (state.trip)
    return state.lastSeenAt < state.trip.letterAt
      ? state.trip.letterAt
      : state.trip.returnsAt;
  return null;
}

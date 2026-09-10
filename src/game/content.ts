export type FoodId = "food_home_meal" | "food_yeerba" | "food_guokui";
export type GearId = "gear_bamboo_flask" | "gear_oilpaper_umbrella";
export type RouteId =
  | "route_daoming"
  | "route_chengdu_tea"
  | "route_huanglongxi";
export type CardId =
  | "card_daoming_01"
  | "card_daoming_02"
  | "card_daoming_03"
  | "card_tea_01"
  | "card_tea_02"
  | "card_tea_03"
  | "card_river_01"
  | "card_river_02"
  | "card_river_03";
export type SouvenirId =
  | "souvenir_bamboo_mat"
  | "souvenir_bamboo_basket"
  | "souvenir_gaiwan"
  | "souvenir_tea_stool"
  | "souvenir_river_sketch"
  | "souvenir_pebble";
export type ItemId = FoodId | GearId | SouvenirId;

export const FOODS: {
  id: FoodId;
  name: string;
  price: number;
  hint: string;
  description: string;
}[] = [
  {
    id: "food_home_meal",
    name: "家常饭",
    price: 0,
    hint: "随便走走，哪里都好",
    description: "一小碗热饭，路上吃着踏实。免费，随时可以装。",
  },
  {
    id: "food_yeerba",
    name: "叶儿粑",
    price: 8,
    hint: "更想往竹林边走",
    description: "叶子包着软糯的一口。更容易去道明竹乡，不指定目的地。",
  },
  {
    id: "food_guokui",
    name: "锅盔",
    price: 8,
    hint: "更想找个茶铺歇脚",
    description: "外皮酥酥的，配一碗茶正好。更容易去成都坝坝茶。",
  },
];
export const GEARS: {
  id: GearId;
  name: string;
  price: number;
  hint: string;
  description: string;
}[] = [
  {
    id: "gear_bamboo_flask",
    name: "小竹筒",
    price: 24,
    hint: "竹林边走走也不渴",
    description: "装一筒水，慢慢喝。更容易去竹乡；买一次，每趟都能带。",
  },
  {
    id: "gear_oilpaper_umbrella",
    name: "油纸伞",
    price: 24,
    hint: "河边走走，也踏实",
    description: "落雨就撑开。更容易去黄龙溪河街；买一次，每趟都能带。",
  },
];
export const ROUTES: {
  id: RouteId;
  name: string;
  shortName: string;
  note: string;
  tint: string;
}[] = [
  {
    id: "route_daoming",
    name: "道明竹乡",
    shortName: "竹乡",
    note: "竹影与篾香",
    tint: "#64794c",
  },
  {
    id: "route_chengdu_tea",
    name: "成都坝坝茶",
    shortName: "坝坝茶",
    note: "一碗茶的工夫",
    tint: "#9a724d",
  },
  {
    id: "route_huanglongxi",
    name: "黄龙溪河街",
    shortName: "河街",
    note: "沿着水声慢慢走",
    tint: "#607d84",
  },
];
export const CARDS: {
  id: CardId;
  routeId: RouteId;
  title: string;
  text: string;
  note: string;
}[] = [
  {
    id: "card_daoming_01",
    routeId: "route_daoming",
    title: "竹影里打个盹",
    text: "竹影子晃来晃去，它坐着坐着就眯着了。醒来包还在，太阳挪了半截。",
    note: "林盘的竹林、院落、水渠和田地相依。这处乘凉的小角落，是疙宝自己的发现。",
  },
  {
    id: "card_daoming_02",
    routeId: "route_daoming",
    title: "帮忙理了几根竹篾",
    text: "长的放一边，短的放一边。它理了半晌，最满意的还是自己坐的小竹垫。",
    note: "道明竹编与日常器物相伴。疙宝只是帮忙理竹篾，复杂的编法还得慢慢学。",
  },
  {
    id: "card_daoming_03",
    routeId: "route_daoming",
    title: "竹篱边吃叶儿粑",
    text: "把叶子轻轻一揭，热气还在。它先闻了闻，又往竹篱边挪了半步：这儿凉快。",
    note: "叶儿粑在四川多地可见，包叶和做法因地方而异。旅途里的这一份，是故事中的吃食。",
  },
  {
    id: "card_tea_01",
    routeId: "route_chengdu_tea",
    title: "一碗茶，坐半晌",
    text: "茶盖轻轻一拨，先闻到一点香。它端得很认真，喝得很慢。",
    note: "盖碗、竹椅和闲坐，是成都茶馆常见的生活景象。茶不催人，故事也慢慢讲。",
  },
  {
    id: "card_tea_02",
    routeId: "route_chengdu_tea",
    title: "听隔壁摆龙门阵",
    text: "茶都续了两回，隔壁的龙门阵还没摆完。它听到精彩处，往前挪了挪小竹凳。",
    note: "“摆龙门阵”说的是闲聊、讲故事。这回的声音在画外，疙宝听得津津有味。",
  },
  {
    id: "card_tea_03",
    routeId: "route_chengdu_tea",
    title: "竹椅底下乘个凉",
    text: "上头聊得热闹，下头凉风正好。它把包垫稳，决定再坐一会儿。",
    note: "坝坝茶在露天院坝里喝。竹椅下的一小块阴凉，也能成为小旅客的好位置。",
  },
  {
    id: "card_river_01",
    routeId: "route_huanglongxi",
    title: "檐下等雨停",
    text: "瓦檐滴滴答答，它把包往里收了收。雨慢慢下，它慢慢等，倒也不着急。",
    note: "黄龙溪的临河街巷与老屋瓦檐是画面的参照。等雨的故事为本作创作。",
  },
  {
    id: "card_river_02",
    routeId: "route_huanglongxi",
    title: "沿着河街慢慢走",
    text: "石板路走到水边，又拐了一个弯。它也跟着拐了弯，顺便看了看倒影。",
    note: "河水、石板街和临水民居构成河街的日常。这里不还原真实路线，也不需要赶路。",
  },
  {
    id: "card_river_03",
    routeId: "route_huanglongxi",
    title: "桥洞里听水声",
    text: "外头的脚步远了，桥洞里只剩水响。它听了半晌，把这段安静也装进包里。",
    note: "桥洞框景是原创取景，不对应一座指定古桥。纪念物与旅途情节都是虚构所得。",
  },
];
export const SOUVENIRS: {
  id: SouvenirId;
  routeId: RouteId;
  name: string;
  description: string;
}[] = [
  {
    id: "souvenir_bamboo_mat",
    routeId: "route_daoming",
    name: "小竹垫",
    description: "把竹乡的一点清凉，带回家里。",
  },
  {
    id: "souvenir_bamboo_basket",
    routeId: "route_daoming",
    name: "小竹篮",
    description: "不大一个，刚好装些零零碎碎。",
  },
  {
    id: "souvenir_gaiwan",
    routeId: "route_chengdu_tea",
    name: "小盖碗",
    description: "以后在屋里，也能慢慢喝一碗。",
  },
  {
    id: "souvenir_tea_stool",
    routeId: "route_chengdu_tea",
    name: "小竹凳",
    description: "往门口一摆，坐着听风也安逸。",
  },
  {
    id: "souvenir_river_sketch",
    routeId: "route_huanglongxi",
    name: "河街速写",
    description: "线画得有点歪，那条河倒是一眼认得。",
  },
  {
    id: "souvenir_pebble",
    routeId: "route_huanglongxi",
    name: "圆石小摆件",
    description: "像一滴停下来的水，摸着凉凉的。",
  },
];
export const FOOD_NAMES = Object.fromEntries(
  FOODS.map((x) => [x.id, x.name]),
) as Record<FoodId, string>;
export const GEAR_NAMES = Object.fromEntries(
  GEARS.map((x) => [x.id, x.name]),
) as Record<GearId, string>;
export const cardById = (id: CardId) => CARDS.find((x) => x.id === id)!;
export const routeById = (id: RouteId) => ROUTES.find((x) => x.id === id)!;
export const souvenirById = (id: SouvenirId) =>
  SOUVENIRS.find((x) => x.id === id)!;
export const itemName = (id: ItemId) =>
  [...FOODS, ...GEARS, ...SOUVENIRS].find((x) => x.id === id)!.name;
export const cardImage = (id: CardId) => `/art/cards/${id}.webp`;
export const itemImage = (id: ItemId) => `/art/items/${id}.webp`;

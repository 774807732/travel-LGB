export type FoodId = "food_home_meal" | "food_yeerba" | "food_guokui" | "food_sweet_potato_congee";
export type GearId = "gear_bamboo_flask" | "gear_oilpaper_umbrella" | "gear_straw_hat";
export type RouteId =
  | "route_daoming"
  | "route_chengdu_tea"
  | "route_huanglongxi"
  | "route_tianba";
export type CardId =
  | "card_daoming_01"
  | "card_daoming_02"
  | "card_daoming_03"
  | "card_daoming_04"
  | "card_tea_01"
  | "card_tea_02"
  | "card_tea_03"
  | "card_tea_04"
  | "card_river_01"
  | "card_river_02"
  | "card_river_03"
  | "card_river_04"
  | "card_tianba_01"
  | "card_tianba_02"
  | "card_tianba_03"
  | "card_tianba_04";
export type SouvenirId =
  | "souvenir_bamboo_mat"
  | "souvenir_bamboo_basket"
  | "souvenir_gaiwan"
  | "souvenir_tea_stool"
  | "souvenir_river_sketch"
  | "souvenir_glass_panda"
  | "souvenir_bamboo_dragonfly"
  | "souvenir_palm_fan"
  | "souvenir_wooden_boat"
  | "souvenir_corn"
  | "souvenir_sweet_potato"
  | "souvenir_small_pumpkin";
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
  {
    id: "food_sweet_potato_congee",
    name: "红苕稀饭",
    price: 8,
    hint: "不要胀太多哦",
    description: "不要胀太多哦",
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
    // 保留旧 ID，让已买油纸伞、预备行囊与在途/历史快照直接接续。
    id: "gear_oilpaper_umbrella",
    name: "筒靴鞋",
    price: 24,
    hint: "河边走走，也踏实",
    description: "套上筒靴鞋，落雨也好走。更容易去黄龙溪河街；买一次，每趟都能带。",
  },
  {
    id: "gear_straw_hat",
    name: "草帽",
    price: 24,
    hint: "帽檐一压，太阳也没得法",
    description: "田埂边慢慢走，戴着遮太阳。更容易去田坝地头；买一次，每趟都能带。",
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
  {
    id: "route_tianba",
    name: "田坝地头",
    shortName: "田坝",
    note: "田埂上的晌午",
    tint: "#86934f",
  },
];
export const CARDS: {
  id: CardId;
  routeId: RouteId;
  title: string;
  text: string;
  note: string;
  requiredFood?: FoodId;
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
    id: "card_daoming_04",
    routeId: "route_daoming",
    title: "竹林边，抓天牛",
    text: "天牛刚从树皮上探出头，就被它轻轻拢在爪爪里。两根长须晃啊晃，它也跟着歪脑壳：你倒是莫慌嘛。",
    note: "这场竹林边的小相遇是原创故事。看够了，就让天牛回树上去，不往包里装。",
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
    id: "card_tea_04",
    routeId: "route_chengdu_tea",
    title: "看人采耳，自己也眯了眼",
    text: "师傅拿着细家伙什，在茶客耳边轻轻忙活。它蹲在树杈上往下看，见人家眯着眼，自己也跟着眯了眯。",
    note: "采耳的是树下的茶客，疙宝只在枝头安静看一会儿。这段虚构见闻，不是采耳操作示范。",
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
  {
    id: "card_river_04",
    routeId: "route_huanglongxi",
    title: "送片叶子顺水走",
    text: "它把一片落叶轻轻搁在水面上。叶子转了个圈才往前走，它蹲在岸边，又送了好一截目光。",
    note: "一片落叶、几圈水纹，就是这趟旅途的小事。河街取景与情节均为原创，不对应指定河岸。",
  },
  {
    id: "card_tianba_01",
    routeId: "route_tianba",
    title: "幺姑婆，又在地头吃晌午啊",
    text: "幺姑婆搁下锄头，坐在田埂边吃晌午。它挥挥手打招呼，幺姑婆端着碗笑了：过来歇一哈嘛。",
    note: "地头是田边，吃晌午是吃午饭。这位幺姑婆和这场相遇，都是疙宝旅途里的故事。",
  },
  {
    id: "card_tianba_02",
    routeId: "route_tianba",
    title: "红烧稀饭胀多了",
    text: "红苕甜，稀饭香，它一口接一口。碗见了底，肚皮也圆了：先坐一哈，等会儿再走。",
    note: "这一趟带上红苕稀饭，才有这场吃得饱饱的田边小歇。不要胀太多哦。",
    requiredFood: "food_sweet_potato_congee",
  },
  {
    id: "card_tianba_03",
    routeId: "route_tianba",
    title: "草帽底下，眯一哈",
    text: "田里的风吹过来，帽檐轻轻一晃。它把蓝布包靠稳，在田埂边眯了一小觉。",
    note: "稻田、水渠和林盘相依，是这段虚构旅途的背景。草帽底下的一小片阴凉，也很安逸。",
  },
  {
    id: "card_tianba_04",
    routeId: "route_tianba",
    title: "坝坝宴，安逸～",
    text: "院坝里摆开了一桌又一桌，寿桃端到了老人家面前。它蹲在树杈上往下看，笑声一阵阵飘过来：今天这儿，闹热得很。",
    note: "这场坝坝宴选了祝寿的主题，寿字、寿桃和围桌笑语都是故事里的布置，不对应真实人物或宴席。",
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
    id: "souvenir_glass_panda",
    routeId: "route_huanglongxi",
    name: "琉璃熊猫摆件",
    description: "迎着光看，圆滚滚的一点透亮。",
  },
  { id: "souvenir_bamboo_dragonfly", routeId: "route_daoming", name: "竹蜻蜓", description: "两手一搓，把竹乡的风放出去。" },
  { id: "souvenir_palm_fan", routeId: "route_chengdu_tea", name: "小蒲扇", description: "轻轻摇两下，龙门阵还没摆完。" },
  { id: "souvenir_wooden_boat", routeId: "route_huanglongxi", name: "小木船", description: "船小小的，把河街的水声记住了。" },
  { id: "souvenir_corn", routeId: "route_tianba", name: "包谷", description: "苞叶一揭，满满一棒田坝里的太阳。" },
  { id: "souvenir_sweet_potato", routeId: "route_tianba", name: "红苕", description: "幺姑婆塞的两个红苕，朴实又暖心。" },
  { id: "souvenir_small_pumpkin", routeId: "route_tianba", name: "小南瓜", description: "圆墩墩一个，抱回屋里也喜庆。" },
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
export const cardImage = (id: CardId) =>
  `/art/cards/${id}.webp?v=${id.endsWith("_04") ? "fourth-v1" : "clean-v2"}`;
export const itemImage = (id: ItemId) =>
  `/art/items/${id === "gear_oilpaper_umbrella" ? "gear_rain_boots" : id}.${id.startsWith("souvenir_") ? "png" : "webp"}`;

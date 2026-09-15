import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Icon } from "./components/Icon";
import { Sheet } from "./components/Sheet";
import { ToadActor, type HopCommand } from "./components/ToadActor";
import {
  availableHarvests,
  availableLetters,
  buyItem,
  cancelPreparation,
  harvest,
  markLetterRead,
  newGame,
  nextEventAt,
  prepareTrip,
  type GameState,
  type Loadout,
} from "./game/engine";
import {
  CARDS,
  FOODS,
  GEARS,
  ROUTES,
  SOUVENIRS,
  cardById,
  cardImage,
  itemImage,
  itemName,
  routeById,
  souvenirById,
  type CardId,
  type ItemId,
  type SouvenirId,
} from "./game/content";
import { decodeSave, MAX_IMPORT_BYTES } from "./game/storage";
import { enableAudio, playSound } from "./game/audio";
import { useGame } from "./game/useGame";
import { SaveNotice } from "./components/SaveNotice";
import {
  DESKTOP_MEDIA,
  WIDE_HARVEST_TRAYS,
  initialScenePositions,
  isWalkable,
  sceneImage,
  type SceneLayout,
  type ScenePoint,
} from "./game/walkable";

type Panel =
  | "bag"
  | "food"
  | "gear"
  | "shop"
  | "journal"
  | "souvenirs"
  | "records"
  | "inbox"
  | "card"
  | "object"
  | "settings"
  | "import"
  | "confirm"
  | "help"
  | null;
const emptyBag: Loadout = { food: "food_home_meal", gear: null };
const formatDate = (time: number) =>
  new Date(time).toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
const ItemArt = ({ id }: { id: ItemId }) => (
  <img className="item-art" src={itemImage(id)} alt="" draggable="false" />
);

function Scene({
  state,
  layout,
  pose,
  leaving,
  onToad,
  onBag,
  onYard,
  onHome,
  onGifts,
  onHarvest,
  onShop,
  onInbox,
  unread,
  toadPosition,
  hopCommand,
  quietMotion,
  onGround,
  onLand,
  onBlocked,
}: {
  state: GameState;
  layout: SceneLayout;
  pose: string;
  leaving: boolean;
  onToad: () => void;
  onBag: () => void;
  onYard: () => void;
  onHome: () => void;
  onGifts: () => void;
  onHarvest: () => void;
  onShop: () => void;
  onInbox: () => void;
  unread: number;
  toadPosition: ScenePoint;
  hopCommand: HopCommand | null;
  quietMotion: boolean;
  onGround: (point: ScenePoint) => void;
  onLand: (point: ScenePoint) => void;
  onBlocked: () => void;
}) {
  const home = state.scene === "home",
    ready = availableHarvests(state),
    lastGift = state.completed.at(-1)?.souvenirId;
  function handleGroundClick(event: MouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    onGround({
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    });
  }
  const atHome = state.phase !== "traveling" || leaving;
  return (
    <section
      className={"scene scene-" + state.scene + (atHome ? " can-move" : "")}
      data-layout={layout}
      aria-label={home ? "疙宝的屋里" : "竹林边的院坝"}
      onClick={atHome && !leaving ? handleGroundClick : undefined}
    >
      <img
        className="scene-background"
        src={sceneImage(state.scene, layout)}
        alt={
          home
            ? "木窗外是竹林与水渠，竹榻和矮桌围着安静的地板。"
            : "林盘小屋外，竹林、水渠和院坝。"
        }
        fetchPriority="high"
        draggable="false"
      />
      <span className="scene-label">
        {home ? "屋里 · 歇个脚" : "院坝 · 吹吹风"}
      </span>
      {home ? (
        <>
          <button
            className="world-hotspot home-door"
            aria-label="推门去院坝"
            onClick={onYard}
          >
            <span className="hotspot-hint">
              去院坝 <Icon name="arrow" size={14} />
            </span>
          </button>
          {state.phase === "home" && (
            <button
              className="world-prop satchel-prop"
              aria-label="打开布挎包，收拾行囊"
              onClick={onBag}
            >
              <img src="/art/props/satchel.webp" alt="靛蓝布挎包" />
              <span className="prop-hint">收拾行囊</span>
            </button>
          )}
          <button
            className={"world-prop gift-prop " + (lastGift ? "has-gift" : "")}
            aria-label={lastGift ? "看看带回的纪念物" : "看看纪念物小格"}
            onClick={onGifts}
          >
            {lastGift ? (
              <ItemArt id={lastGift} />
            ) : (
              <span className="empty-shelf-label">小物件</span>
            )}
            {state.hasUnreadReturn && <i className="dot" />}
          </button>
        </>
      ) : (
        <>
          <button
            className="world-hotspot yard-door"
            aria-label="回屋里"
            onClick={onHome}
          >
            <span className="hotspot-hint">
              <Icon name="back" size={14} /> 回屋
            </span>
          </button>
          <button
            className="world-hotspot yard-shop"
            aria-label="去院坝小铺"
            onClick={onShop}
          >
            <span className="hotspot-hint">
              小铺 <Icon name="arrow" size={14} />
            </span>
          </button>
          <button
            className={"world-prop mail-prop " + (unread ? "has-letter" : "")}
            aria-label={
              unread ? "信夹，有 " + unread + " 封未读来信" : "看看信夹"
            }
            onClick={onInbox}
          >
            <img src="/art/props/mail-clip.webp" alt="院坝信夹" />
            {unread > 0 && <i className="dot" />}
          </button>
          {layout === "wide" ? (
            <div className="harvest-wide">
              {WIDE_HARVEST_TRAYS.map((point, i) => (
                <button
                  key={i}
                  className="harvest-tray"
                  style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
                  aria-label={`${i + 1} 号簸箕，${ready ? `收起 ${ready} 份收成` : "收成还在慢慢攒着"}`}
                  onClick={onHarvest}
                >
                  <img
                    className={i < ready ? "ready" : ""}
                    src="/art/props/harvest-tray.webp"
                    alt=""
                    draggable="false"
                  />
                </button>
              ))}
              <button className="harvest-caption" onClick={onHarvest}>
                {ready ? ready + " 份收成，可以收啦" : "收成慢慢来，不用守着"}
              </button>
            </div>
          ) : (
            <button
              className="harvest-props"
              aria-label={
                ready ? "收起 " + ready + " 份收成" : "收成还在慢慢攒着"
              }
              onClick={onHarvest}
            >
              {[0, 1, 2].map((i) => (
                <img
                  key={i}
                  className={i < ready ? "ready" : ""}
                  src="/art/props/harvest-tray.webp"
                  alt=""
                />
              ))}
              <span>
                {ready ? ready + " 份收成，可以收啦" : "收成慢慢来，不用守着"}
              </span>
            </button>
          )}
        </>
      )}
      {atHome ? (
        <ToadActor
          key={layout + state.scene}
          scene={state.scene}
          layout={layout}
          position={toadPosition}
          command={hopCommand}
          pose={pose}
          leaving={leaving}
          quietMotion={quietMotion}
          onLand={onLand}
          onBlocked={onBlocked}
          onToad={onToad}
        />
      ) : (
        <div className="away-note" role="note" aria-label="疙宝留下的出门留言">
          <img
            className="away-note-art"
            src="/art/props/departure-note.webp"
            alt=""
            draggable="false"
          />
          <div className="away-note-copy">
            <p>
              出去转转，
              <br />
              莫急。
            </p>
            <span>—— 疙宝</span>
          </div>
        </div>
      )}
    </section>
  );
}

export default function App() {
  const debug = new URLSearchParams(location.search).get("debug") === "1";
  const game = useGame(debug),
    { state, mode, warning, act, replace, advanceDebug } = game;
  const [panel, setPanel] = useState<Panel>(null),
    [draft, setDraft] = useState<Loadout>(emptyBag);
  const [selectedCard, setSelectedCard] = useState<CardId>("card_daoming_01"),
    [selectedObject, setSelectedObject] = useState<SouvenirId>(
      "souvenir_bamboo_mat",
    ),
    [returnPanel, setReturnPanel] = useState<Panel>("journal");
  const [toast, setToast] = useState(""),
    [idlePose, setIdlePose] = useState(0),
    [leaving, setLeaving] = useState(false),
    [hopCommand, setHopCommand] = useState<HopCommand | null>(null),
    [toadPositions, setToadPositions] = useState(initialScenePositions);
  const [layout, setLayout] = useState<SceneLayout>(() =>
    matchMedia(DESKTOP_MEDIA).matches ? "wide" : "portrait",
  );
  const [importText, setImportText] = useState(""),
    [importError, setImportError] = useState("");
  const [candidate, setCandidate] = useState<{
      state: GameState;
      label: string;
    } | null>(null),
    [showBackupText, setShowBackupText] = useState(false),
    [recordLimit, setRecordLimit] = useState(20);
  const [systemReduced, setSystemReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const quietMotion = state.reducedMotion || systemReduced;
  const [readerScene, setReaderScene] = useState<GameState["scene"]>("home");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
      undefined,
    ),
    previousPhase = useRef(state.phase),
    fileInput = useRef<HTMLInputElement>(null);
  const canWrite = mode === "owner",
    canReplace = canWrite || mode === "protected",
    letters = availableLetters(state),
    unread = letters.filter((t) => !state.readLetters.includes(t.id)),
    latest = letters.at(-1);
  const ready = availableHarvests(state),
    pose =
      state.phase === "packed"
        ? "packing"
        : ["idle", "eating", "dozing"][idlePose],
    card = cardById(selectedCard),
    object = souvenirById(selectedObject);
  const showToast = (message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4200);
  };
  async function perform(
    action: (s: GameState, now: number) => GameState,
    message?: string,
  ) {
    try {
      await act(action);
      if (message) showToast(message);
      return true;
    } catch (error) {
      showToast((error as Error).message);
      return false;
    }
  }
  function open(next: Panel) {
    playSound("tap");
    if (next === "bag")
      setDraft(state.bag ? { ...state.bag } : { ...emptyBag });
    if (next === "souvenirs" && state.hasUnreadReturn && canWrite)
      perform((s) => ({ ...s, hasUnreadReturn: false }));
    setPanel(next);
  }
  async function changeScene(scene: GameState["scene"]) {
    setHopCommand(null);
    if (mode === "reader" || mode === "unavailable") {
      setReaderScene(scene);
      playSound("tap");
      return;
    }
    if (await perform((s) => ({ ...s, scene }))) playSound("tap");
  }
  function moveToad(point: ScenePoint) {
    const scene = viewState.scene;
    if (!isWalkable(scene, point, layout)) {
      showToast("那边有东西，换块空地嘛。");
      return;
    }
    setIdlePose(0);
    setHopCommand((command) => ({ id: (command?.id ?? 0) + 1, target: point }));
    playSound("tap");
  }
  function readCard(id: CardId, from: Panel, tripId?: string) {
    setSelectedCard(id);
    setReturnPanel(from);
    setPanel("card");
    playSound("letter");
    if (tripId && canWrite && !state.readLetters.includes(tripId))
      perform((s, now) => markLetterRead(s, tripId, now));
  }
  async function collect() {
    if (!ready) {
      showToast("每隔四小时攒一份，最多留三份。莫急。");
      return;
    }
    if (await perform(harvest, "收好咯，盘缠 +" + ready * 12 + " 文。"))
      playSound("harvest");
  }
  function download(text: string, name = "旅行癞疙宝存档") {
    const url = URL.createObjectURL(
        new Blob([text], { type: "application/json" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = name + "-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("已发起下载，记得把存档收好。");
  }
  function inspectImport(text: string) {
    try {
      const decoded = decodeSave(text);
      setCandidate({
        state: decoded.state,
        label: decoded.migrated ? "导入旧版存档（自动升级）" : "导入这份存档",
      });
      setImportError("");
      setPanel("confirm");
    } catch (error) {
      setImportError((error as Error).message);
    }
  }
  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
    },
    [],
  );
  useEffect(() => {
    const media = matchMedia(DESKTOP_MEDIA);
    const sync = () => {
      setHopCommand(null);
      setLayout(media.matches ? "wide" : "portrait");
    };
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)"),
      sync = () => setSystemReduced(media.matches);
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    for (const name of [
      "packing",
      "eating",
      "dozing",
      "walking",
      "jump-atlas",
    ]) {
      const image = new Image();
      image.src = "/art/characters/" + name + ".webp";
    }
  }, []);
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(quietMotion);
  }, [quietMotion]);
  useEffect(() => {
    if (quietMotion) return;
    const timer = setInterval(() => setIdlePose((i) => (i + 1) % 3), 18000);
    return () => clearInterval(timer);
  }, [quietMotion]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (state.phase === "traveling") setHopCommand(null);
    if (
      previousPhase.current === "packed" &&
      state.phase === "traveling" &&
      !quietMotion
    ) {
      setLeaving(true);
      timer = setTimeout(() => setLeaving(false), 1000);
    }
    previousPhase.current = state.phase;
    return () => clearTimeout(timer);
  }, [state.phase, quietMotion]);
  useEffect(() => {
    if (!state.soundEnabled) {
      void enableAudio(false);
      return;
    }
    const resume = () => void enableAudio(true);
    document.addEventListener("pointerdown", resume, { once: true });
    document.addEventListener("keydown", resume, { once: true });
    return () => {
      document.removeEventListener("pointerdown", resume);
      document.removeEventListener("keydown", resume);
    };
  }, [state.soundEnabled]);
  const statusTitle =
    state.phase === "packed"
      ? "包包收好了，等它出门"
      : state.phase === "traveling"
        ? "出门转悠去了"
        : state.hasUnreadReturn
          ? "回来咯，带了个小东西"
          : "疙宝在家，正安逸着";
  const statusCopy =
    state.phase === "packed"
      ? "出门前还能改。它收拾妥当，就自己走。"
      : state.phase === "traveling"
        ? state.trip?.number === 1
          ? "第一次出门，就在附近走走。"
          : "这趟大约半天内回来，不用一直守着。"
        : state.completed.length
          ? "歇够了，再给它备一份吃的。"
          : "一份家常饭，就能开始第一趟小旅行。";
  const titles: Record<Exclude<Panel, null>, string> = {
    bag: "收拾行囊",
    food: "带点什么吃的",
    gear: "带个家伙什",
    shop: "院坝小铺",
    journal: "疙宝的手账",
    souvenirs: "疙宝的手账",
    records: "疙宝的手账",
    inbox: "窗边信夹",
    card: "路上的见闻",
    object: "带回的小东西",
    settings: "小设置",
    import: "带回一份存档",
    confirm: candidate?.label ?? "确认存档",
    help: "慢慢玩，不着急",
  };
  const back = () =>
    setPanel(
      panel === "food" || panel === "gear"
        ? "bag"
        : panel === "card" || panel === "object"
          ? returnPanel
          : "settings",
    );
  const packedBag =
    state.phase === "traveling" ? (state.bag ?? emptyBag) : draft;
  const viewState =
    mode === "reader" || mode === "unavailable"
      ? { ...state, scene: readerScene }
      : state;
  return (
    <main className="game-page" data-layout={layout}>
      <div className="game-column">
        {debug && (
          <div className="mode-banner">
            独立测试存档 · <a href="/">回到正常游戏</a>
          </div>
        )}
        <section className="game-shell" aria-label="旅行癞疙宝游戏">
          <header className="game-header">
            <div>
              <p className="eyebrow">蜀地小日子</p>
              <h1>旅行癞疙宝</h1>
            </div>
            <button
              className="icon-button"
              aria-label="打开设置"
              onClick={() => open("settings")}
            >
              <Icon name="settings" />
            </button>
          </header>
          <div className="status-bar">
            <span>家 · 成都平原</span>
            <button
              className="coin-balance"
              aria-label={"盘缠 " + state.coins + " 文，打开小铺"}
              onClick={() => open("shop")}
            >
              <span className="coin-mark">文</span>
              <b>{state.coins}</b>
              <span>盘缠</span>
            </button>
          </div>
          <Scene
            state={viewState}
            layout={layout}
            pose={
              state.phase === "packed" ? "packing" : quietMotion ? "idle" : pose
            }
            leaving={leaving}
            onToad={() =>
              showToast(
                state.phase === "packed"
                  ? "它摸了摸包，饭和家伙什都带好了。"
                  : [
                      "它看了你一眼，又稳稳当当地坐下。",
                      "一口饭，一口茶，正安逸。",
                      "轻一点，让它再眯一会儿。",
                    ][idlePose],
              )
            }
            onBag={() => open("bag")}
            onYard={() => changeScene("yard")}
            onHome={() => changeScene("home")}
            onGifts={() => open("souvenirs")}
            onHarvest={collect}
            onShop={() => open("shop")}
            onInbox={() => open("inbox")}
            unread={unread.length}
            toadPosition={toadPositions[layout][viewState.scene]}
            hopCommand={hopCommand}
            quietMotion={quietMotion}
            onGround={moveToad}
            onLand={(point) =>
              setToadPositions((positions) => ({
                ...positions,
                [layout]: { ...positions[layout], [viewState.scene]: point },
              }))
            }
            onBlocked={() => showToast("这边挤不过去，换块空地嘛。")}
          />
          {viewState.scene === "yard" ? (
            <div className="yard-actions">
              <button onClick={collect}>
                <Icon name="leaf" size={20} />
                <span>收成{ready > 0 && <em>{ready}</em>}</span>
              </button>
              <button onClick={() => open("shop")}>
                <Icon name="bag" size={20} />
                <span>逛小铺</span>
              </button>
              <button onClick={() => open("inbox")}>
                <Icon name="letter" size={20} />
                <span>
                  信夹{unread.length > 0 && <i className="inline-dot" />}
                </span>
              </button>
            </div>
          ) : (
            <button
              className={"letter-ribbon " + (unread.length ? "unread" : "")}
              onClick={() =>
                latest
                  ? readCard(
                      (unread[0] ?? latest).cardId,
                      "inbox",
                      (unread[0] ?? latest).id,
                    )
                  : open("inbox")
              }
            >
              <Icon name="letter" size={19} />
              <span>
                {unread.length
                  ? "捎信来咯，展开看看"
                  : latest
                    ? "信都收好了，想看就翻翻"
                    : "窗边的信夹，等一封远方来信"}
              </span>
              {unread.length > 0 ? (
                <i className="inline-dot" />
              ) : (
                <Icon name="arrow" size={16} />
              )}
            </button>
          )}
          <div className="traveler-status" aria-live="polite">
            <span className={"status-seed " + state.phase} />
            <div>
              <h2>{statusTitle}</h2>
              <p>{statusCopy}</p>
            </div>
            {state.hasUnreadReturn && (
              <button className="tiny-button" onClick={() => open("souvenirs")}>
                看看
              </button>
            )}
          </div>
          <nav className="bottom-nav" aria-label="游戏导航">
            {(
              [
                { id: "home", label: "屋里", icon: "home" },
                { id: "yard", label: "院坝", icon: "yard" },
                { id: "bag", label: "行囊", icon: "bag" },
                { id: "journal", label: "手账", icon: "book" },
              ] as const
            ).map((nav) => (
              <button
                key={nav.id}
                className={
                  !panel && viewState.scene === nav.id ? "selected" : ""
                }
                aria-current={
                  !panel && viewState.scene === nav.id ? "page" : undefined
                }
                onClick={() =>
                  nav.id === "home" || nav.id === "yard"
                    ? changeScene(nav.id)
                    : open(nav.id)
                }
              >
                <Icon name={nav.icon} />
                <span>{nav.label}</span>
                {nav.id === "journal" && state.hasUnreadReturn && (
                  <i className="nav-dot" />
                )}
              </button>
            ))}
          </nav>
        </section>
        <p
          className={
            "save-status " + (["protected", "unavailable"].includes(mode) ? "save-warning" : "")
          }
          role="status"
        >
          {mode === "loading"
            ? "正在打开疙宝的小屋…"
            : mode === "protected"
              ? warning
              : mode === "reader" || mode === "unavailable"
                ? game.readOnlyNotice
                : (warning ?? "进度留在此浏览器 · 离开也会继续旅行")}
        </p>
        {mode === "protected" && (
          <button className="secondary" onClick={() => open("settings")}>
            导出原始数据 / 恢复存档
          </button>
        )}
        <SaveNotice onOpenSettings={() => open("settings")} />
        {!state.tutorialStarted && state.phase === "home" && (
          <button className="first-guide" onClick={() => open("bag")}>
            先装一份免费的家常饭 <Icon name="arrow" size={16} />
          </button>
        )}
      </div>
      {debug && (
        <aside className="debug-panel">
          <p className="eyebrow">仅供制作验收</p>
          <h2>时间试验台</h2>
          <p>推进同一套规则，不直接发放奖励。</p>
          <dl>
            <dt>阶段</dt>
            <dd data-testid="debug-phase">{state.phase}</dd>
            <dt>当前旅程</dt>
            <dd>{state.trip?.number ?? "—"}</dd>
            <dt>目的地</dt>
            <dd>{state.trip ? routeById(state.trip.routeId).name : "—"}</dd>
            <dt>已归来</dt>
            <dd>{state.completed.length} 趟</dd>
            <dt>已收集</dt>
            <dd>
              {state.unlockedCards.length} / {CARDS.length} 张 ·{" "}
              {Object.keys(state.souvenirs).length} / {SOUVENIRS.length} 种
            </dd>
          </dl>
          <button
            disabled={!canWrite || nextEventAt(state) === null}
            onClick={() => void advanceDebug().catch((error: Error) => showToast(error.message))}
          >
            推进到下一事件
          </button>
          <button disabled={!canWrite} onClick={() => void advanceDebug(86400000).catch((error: Error) => showToast(error.message))}>
            模拟离线一天
          </button>
          <button
            disabled={!canWrite || state.phase !== "home"}
            onClick={() => perform((s, now) => prepareTrip(s, emptyBag, now))}
          >
            用家常饭再出一趟
          </button>
          <a href="/outputs/wireframes/index.html">查看早期交互线框</a>
        </aside>
      )}
      {panel && (
        <Sheet
          title={titles[panel]}
          viewKey={
            panel === "card"
              ? selectedCard
              : panel === "object"
                ? selectedObject
                : panel
          }
          onClose={() => setPanel(null)}
          back={[
            "food",
            "gear",
            "card",
            "object",
            "help",
            "import",
            "confirm",
          ].includes(panel)}
          onBack={back}
        >
          {(mode === "reader" || mode === "unavailable") && (
            <p className="notice">
              {game.readOnlyNotice}
            </p>
          )}
          {panel === "bag" && (
            <>
              <p className="muted intro">一份路上吃的，再带个顺手的家伙什。</p>
              <div className="loadout-grid">
                <button
                  className="loadout-slot"
                  disabled={state.phase === "traveling" || !canWrite}
                  onClick={() => setPanel("food")}
                >
                  <small>吃食 · 必选</small>
                  <ItemArt id={packedBag.food} />
                  <b>{itemName(packedBag.food)}</b>
                  <span>
                    {packedBag.food === "food_home_meal"
                      ? "免费 · 随时有"
                      : "出门时用掉一份"}
                  </span>
                </button>
                <button
                  className="loadout-slot"
                  disabled={state.phase === "traveling" || !canWrite}
                  onClick={() => setPanel("gear")}
                >
                  <small>用具 · 可选</small>
                  {packedBag.gear ? (
                    <ItemArt id={packedBag.gear} />
                  ) : (
                    <span className="empty-slot">
                      <Icon name="leaf" size={32} />
                    </span>
                  )}
                  <b>
                    {packedBag.gear ? itemName(packedBag.gear) : "不带用具"}
                  </b>
                  <span>
                    {packedBag.gear ? "买一次，每趟都能带" : "轻轻松松也挺好"}
                  </span>
                </button>
              </div>
              <div className="paper-note">
                {state.phase === "traveling"
                  ? "包包已经背走了，等它回来再收拾。不用担心，这趟的吃食已经带上。"
                  : state.phase === "packed"
                    ? "吃食先留着，出门才消耗。改完确认会重新等待；原样确认不会催它，也不会重置时间。"
                    : "去哪儿由疙宝自己决定。吃食和用具只影响它的兴致；免费家常饭也能收齐全部见闻。"}
              </div>
              {state.phase !== "traveling" && (
                <>
                  <button
                    className="primary"
                    disabled={!canWrite}
                    onClick={async () => {
                      if (
                        await perform(
                          (s, now) => prepareTrip(s, draft, now),
                          "包包收好咯，它会自己出门。",
                        )
                      ) {
                        playSound("bag");
                        setPanel(null);
                      }
                    }}
                  >
                    {state.phase === "packed" ? "确认行囊" : "收拾好了"}
                  </button>
                  {state.phase === "packed" && (
                    <button
                      className="secondary"
                      disabled={!canWrite}
                      onClick={async () => {
                        if (
                          await perform(cancelPreparation, "先在家歇歇，吃食还在。")
                        )
                          setPanel(null);
                      }}
                    >
                      先不出门了
                    </button>
                  )}
                </>
              )}
            </>
          )}
          {panel === "food" && (
            <>
              <p className="muted intro">
                特色吃食从小铺买。家常饭，家里一直备着。
              </p>
              {FOODS.map((food) => {
                const count =
                  food.id === "food_home_meal"
                    ? Infinity
                    : state.inventory[food.id];
                return (
                  <button
                    className="choice-row"
                    key={food.id}
                    disabled={
                      !canWrite || state.phase === "traveling" || count === 0
                    }
                    onClick={() => {
                      setDraft({ ...draft, food: food.id });
                      setPanel("bag");
                      playSound("bag");
                    }}
                  >
                    <ItemArt id={food.id} />
                    <span>
                      <b>{food.name}</b>
                      <small>{food.hint}</small>
                      <small>
                        {count === Infinity
                          ? "免费 · 随时有"
                          : "还剩 " + count + " 份"}
                      </small>
                    </span>
                    {draft.food === food.id ? (
                      <Icon name="check" size={20} />
                    ) : (
                      <span className="choice-action">装上</span>
                    )}
                  </button>
                );
              })}
              <button className="secondary" onClick={() => open("shop")}>
                去小铺备点吃的
              </button>
            </>
          )}
          {panel === "gear" && (
            <>
              <button
                className="choice-row"
                disabled={!canWrite || state.phase === "traveling"}
                onClick={() => {
                  setDraft({ ...draft, gear: null });
                  setPanel("bag");
                }}
              >
                <span className="empty-slot">
                  <Icon name="leaf" />
                </span>
                <span>
                  <b>不带用具</b>
                  <small>一份吃的，就可以出门</small>
                </span>
                {!draft.gear && <Icon name="check" size={20} />}
              </button>
              {GEARS.map((gear) => (
                <button
                  className="choice-row"
                  key={gear.id}
                  disabled={
                    !canWrite ||
                    state.phase === "traveling" ||
                    !state.ownedGear.includes(gear.id)
                  }
                  onClick={() => {
                    setDraft({ ...draft, gear: gear.id });
                    setPanel("bag");
                    playSound("bag");
                  }}
                >
                  <ItemArt id={gear.id} />
                  <span>
                    <b>{gear.name}</b>
                    <small>{gear.hint}</small>
                    <small>
                      {state.ownedGear.includes(gear.id)
                        ? "已经有了 · 一直可用"
                        : "小铺里可以买到"}
                    </small>
                  </span>
                  {draft.gear === gear.id && <Icon name="check" size={20} />}
                </button>
              ))}
              <button className="secondary" onClick={() => open("shop")}>
                去小铺看看
              </button>
            </>
          )}
          {panel === "shop" && (
            <>
              <div className="shop-intro">
                <p>路上的小准备</p>
                <span>
                  现有 <b>{state.coins}</b> 文
                </span>
              </div>
              <p className="muted intro">
                不用样样都买，一份家常饭也能走遍四处。
              </p>
              <h3 className="section-label">
                吃点好的 <small>每趟一份</small>
              </h3>
              {FOODS.filter((f) => f.price > 0).map((item) => (
                <div className="shop-row" key={item.id}>
                  <ItemArt id={item.id} />
                  <div>
                    <b>{item.name}</b>
                    <small>{item.hint}</small>
                    <small>
                      存着{" "}
                      {state.inventory[item.id as keyof typeof state.inventory]}{" "}
                      份
                    </small>
                  </div>
                  <button
                    className="price-button"
                    disabled={!canWrite || state.coins < item.price}
                    aria-label={"购买" + item.name + "，" + item.price + "文"}
                    onClick={async () => {
                      if (
                        await perform(
                          (s, now) => buyItem(s, item.id, now),
                          item.name + "备好了一份。",
                        )
                      )
                        playSound("bag");
                    }}
                  >
                    {item.price} 文
                  </button>
                </div>
              ))}
              <h3 className="section-label">
                顺手的用具 <small>买一次就好</small>
              </h3>
              {GEARS.map((item) => (
                <div className="shop-row" key={item.id}>
                  <ItemArt id={item.id} />
                  <div>
                    <b>{item.name}</b>
                    <small>{item.hint}</small>
                    <small>每趟都能用</small>
                  </div>
                  <button
                    className="price-button"
                    disabled={
                      !canWrite ||
                      state.ownedGear.includes(item.id) ||
                      state.coins < item.price
                    }
                    aria-label={"购买" + item.name + "，" + item.price + "文"}
                    onClick={async () => {
                      if (
                        await perform(
                          (s, now) => buyItem(s, item.id, now),
                          item.name + "收好了，以后都能带。",
                        )
                      )
                        playSound("bag");
                    }}
                  >
                    {state.ownedGear.includes(item.id)
                      ? "已有"
                      : item.price + " 文"}
                  </button>
                </div>
              ))}
              <div className="paper-note">
                院坝每四小时攒一份收成，每份换 12 文，最多留三份。旅途归来再添 8
                文。没有盘缠，也不会卡住旅行。
              </div>
              <button className="secondary" onClick={() => open("bag")}>
                去收拾行囊
              </button>
            </>
          )}
          {["journal", "souvenirs", "records"].includes(panel) && (
            <>
              <nav className="journal-tabs" aria-label="手账分类">
                {(
                  [
                    ["journal", "见闻"],
                    ["souvenirs", "纪念物"],
                    ["records", "旅程"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    aria-pressed={panel === id}
                    onClick={() => open(id)}
                  >
                    {label}
                  </button>
                ))}
              </nav>
              {panel === "journal" && (
                <>
                  <div className="collection-heading">
                    <p>
                      沿途见闻{" "}
                      <strong>
                        {state.unlockedCards.length}
                        <small> / {CARDS.length}</small>
                      </strong>
                    </p>
                    <span>
                      {state.unlockedCards.length === CARDS.length
                        ? "小小一本，装满了蜀地日常。"
                        : "每一次远行，都留一点日常。"}
                    </span>
                  </div>
                  <div className="card-grid" aria-label="全部见闻">
                    {CARDS.map((c) => {
                      const known = state.unlockedCards.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          className={
                            "postcard-thumb " +
                            (known ? "" : "undiscovered")
                          }
                          aria-label={
                            known
                              ? "查看见闻：" + c.title
                              : "尚未收到的见闻"
                          }
                          disabled={!known}
                          onClick={() => readCard(c.id, "journal")}
                        >
                          <span className="thumb-art">
                            {known ? (
                              <img
                                src={cardImage(c.id)}
                                alt=""
                                loading="lazy"
                              />
                            ) : (
                              <Icon name="leaf" size={24} />
                            )}
                          </span>
                          <span className="thumb-title">
                            {known ? c.title : "等一封来信"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              {panel === "souvenirs" && (
                <>
                  <div className="collection-heading">
                    <p>
                      带回的小东西{" "}
                      <strong>
                        {Object.keys(state.souvenirs).length}
                        <small> / {SOUVENIRS.length}</small>
                      </strong>
                    </p>
                    <span>不是贵重的，是它路上惦记着带回来的。</span>
                  </div>
                  <div className="souvenir-grid">
                    {ROUTES.flatMap(route => SOUVENIRS.filter(item => item.routeId === route.id)).map((item) => {
                      const count = state.souvenirs[item.id] ?? 0;
                      return (
                        <button
                          key={item.id}
                          className={
                            "souvenir-tile " + (count ? "" : "undiscovered")
                          }
                          disabled={!count}
                          onClick={() => {
                            setSelectedObject(item.id);
                            setReturnPanel("souvenirs");
                            setPanel("object");
                          }}
                        >
                          {count ? (
                            <ItemArt id={item.id} />
                          ) : (
                            <span className="unknown-object">
                              <Icon name="leaf" size={30} />
                            </span>
                          )}
                          <b>{count ? item.name : "还空着"}</b>
                          <small>
                            {count
                              ? routeById(item.routeId).shortName +
                                " · 带回 " +
                                count +
                                " 件"
                              : "留给下一趟惊喜"}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              {panel === "records" && (
                <div className="trip-records">
                  {state.trip && (
                    <div className="record">
                      <span className="record-number">
                        {String(state.trip.number).padStart(2, "0")}
                      </span>
                      <div>
                        <b>还在路上慢慢走</b>
                        <small>
                          {state.lastSeenAt >= state.trip.letterAt
                            ? routeById(state.trip.routeId).name
                            : "还没捎来消息"}
                        </small>
                      </div>
                      <span className="record-status">在途</span>
                    </div>
                  )}
                  {state.completed
                    .slice()
                    .reverse()
                    .slice(0, recordLimit)
                    .map((trip) => (
                      <button
                        className="record record-button"
                        key={trip.id}
                        onClick={() =>
                          readCard(trip.cardId, "records", trip.id)
                        }
                      >
                        <span className="record-number">
                          {String(trip.number).padStart(2, "0")}
                        </span>
                        <span>
                          <b>{routeById(trip.routeId).name}</b>
                          <small>
                            {formatDate(trip.returnsAt)}归来 ·{" "}
                            {souvenirById(trip.souvenirId).name}
                          </small>
                          <small>盘缠 +8 · 见闻已入册</small>
                        </span>
                        <Icon name="arrow" size={17} />
                      </button>
                    ))}
                  {!state.trip && !state.completed.length && (
                    <div className="empty-state">
                      <Icon name="bag" size={32} />
                      <p>第一趟，就从一份家常饭开始。</p>
                    </div>
                  )}
                  {state.completed.length > recordLimit && (
                    <button
                      className="secondary"
                      onClick={() => setRecordLimit((n) => n + 20)}
                    >
                      再翻一些旧旅程
                    </button>
                  )}
                </div>
              )}
            </>
          )}
          {panel === "inbox" && (
            <>
              {letters.length ? (
                <>
                  <p className="muted intro">
                    {unread.length
                      ? unread.length + " 封还没拆开。见闻已经稳稳收进手账。"
                      : "信都好好收着，想念了就再看看。"}
                  </p>
                  {letters
                    .slice()
                    .reverse()
                    .slice(0, recordLimit)
                    .map((trip) => (
                      <button
                        className="inbox-row"
                        key={trip.id}
                        onClick={() => readCard(trip.cardId, "inbox", trip.id)}
                      >
                        <img src={cardImage(trip.cardId)} alt="" />
                        <span>
                          <b>{cardById(trip.cardId).title}</b>
                          <small>
                            第 {trip.number} 趟 ·{" "}
                            {routeById(trip.routeId).shortName}
                          </small>
                        </span>
                        {!state.readLetters.includes(trip.id) && (
                          <i className="inline-dot" />
                        )}
                      </button>
                    ))}
                  {letters.length > recordLimit && (
                    <button
                      className="secondary"
                      onClick={() => setRecordLimit((n) => n + 20)}
                    >
                      再翻一些来信
                    </button>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <Icon name="letter" size={36} />
                  <p>信夹还是空的。</p>
                  <small>等它走一段，就会捎信回来。</small>
                </div>
              )}
            </>
          )}
          {panel === "card" && (
            <article className="travel-letter">
              <img
                className="letter-art"
                src={cardImage(card.id)}
                alt={routeById(card.routeId).name + "，" + card.title}
              />
              <div className="letter-meta">
                <span>{routeById(card.routeId).name}</span>
                <span>
                  见闻 {String(CARDS.indexOf(card) + 1).padStart(2, "0")}
                </span>
              </div>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <details className="culture-note">
                <summary>一点蜀地生活小注</summary>
                <p>{card.note}</p>
              </details>
              <footer>
                {state.cardCollection[card.id] &&
                  formatDate(state.cardCollection[card.id]!.firstAt) +
                    "初次收到 · 共捎回 " +
                    state.cardCollection[card.id]!.count +
                    " 次"}
                <span>已经收进手账，想看就翻翻。</span>
              </footer>
            </article>
          )}
          {panel === "object" && (
            <article className="object-detail">
              <ItemArt id={object.id} />
              <span className="eyebrow">
                {routeById(object.routeId).name}带回
              </span>
              <h3>{object.name}</h3>
              <p>{object.description}</p>
              <small>家里已经收着 {state.souvenirs[object.id] ?? 0} 件</small>
            </article>
          )}
          {panel === "settings" && (
            <>
              <label className="setting-row">
                <span>
                  一点环境声<small>轻轻的风声、翻纸和收拾声，默认关闭</small>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={state.soundEnabled}
                  disabled={!canWrite}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    if (await perform((s) => ({ ...s, soundEnabled: checked })))
                      void enableAudio(checked);
                  }}
                />
              </label>
              <label className="setting-row">
                <span>
                  减少动效<small>关掉呼吸、姿态轮换和纸页过渡</small>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={state.reducedMotion}
                  disabled={!canWrite}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    perform((s) => ({ ...s, reducedMotion: checked }));
                  }}
                />
              </label>
              <button className="setting-link" onClick={() => setPanel("help")}>
                怎么玩 <Icon name="arrow" size={18} />
              </button>
              <div className="paper-note">
                <b>这间小屋，存在你的浏览器里</b>
                <p>
                  不用注册，不上传游戏进度。离开后，备好的这一趟会继续；回来不会自动开始下一趟。
                </p>
                <small>
                  更换手机、浏览器或网址，不会自动同步存档。请先导出，再到新设备或浏览器导入。清除浏览器数据可能导致存档丢失。
                </small>
              </div>
              <button
                className="secondary"
                onClick={() =>
                  download(
                    mode === "protected"
                      ? game.rawSave()
                      : game.exportCurrent(),
                    mode === "protected"
                      ? "旅行癞疙宝原始数据"
                      : "旅行癞疙宝存档",
                  )
                }
              >
                <Icon name="download" size={18} />{" "}
                {mode === "protected" ? "导出受保护的原始数据" : "导出存档"}
              </button>
              <button
                className="secondary"
                disabled={!canReplace}
                onClick={() => {
                  setImportText("");
                  setImportError("");
                  setPanel("import");
                }}
              >
                导入存档
              </button>
              <button
                className="setting-link"
                disabled={!canReplace}
                onClick={() => {
                  try {
                    const previous = game.previousSave();
                    if (!previous) {
                      showToast("还没有可恢复的历史备份。");
                      return;
                    }
                    setCandidate({ state: previous, label: "恢复上一份备份" });
                    setPanel("confirm");
                  } catch (error) {
                    showToast((error as Error).message);
                  }
                }}
              >
                恢复上一份备份 <Icon name="back" size={18} />
              </button>
              <details
                className="backup-text"
                open={showBackupText}
                onToggle={(e) => setShowBackupText(e.currentTarget.open)}
              >
                <summary>查看可复制的存档文本</summary>
                {showBackupText && (
                  <textarea
                    aria-label="当前存档文本"
                    readOnly
                    value={
                      mode === "protected"
                        ? game.rawSave()
                        : game.exportCurrent()
                    }
                    onFocus={(e) => e.target.select()}
                  />
                )}
              </details>
              <button
                className="text-button danger"
                disabled={!canReplace}
                onClick={() => {
                  setCandidate({
                    state: newGame(Date.now()),
                    label: "重新开始一间小屋",
                  });
                  setPanel("confirm");
                }}
              >
                重新开始
              </button>
              <p className="version-note">
                旅行癞疙宝 · 1.4.5
                <br />
                原创插画与故事 · 本地单人小游戏
              </p>
            </>
          )}
          {panel === "help" && (
            <div className="help-copy">
              <p className="help-lead">
                你只管备好，
                <br />
                让疙宝自己慢慢走。
              </p>
              <ol>
                <li>
                  <b>在院坝收成</b>
                  <p>每四小时一份，最多三份。小铺里能添些特色吃食和用具。</p>
                </li>
                <li>
                  <b>装好一份吃的</b>
                  <p>家常饭免费，用具可不带。第一趟约两分钟就能完整体验。</p>
                </li>
                <li>
                  <b>把时间留给它</b>
                  <p>
                    后续收好行囊约两到五分钟出门，旅途随机一到四小时。会捎信，也会带小东西回家。
                  </p>
                </li>
                <li>
                  <b>慢慢攒一本手账</b>
                  <p>
                    四处蜀地、十六张见闻、十二种纪念物。带上红苕稀饭，还可能遇到田坝的一段特别见闻。没有稀有度，没有完不成的每日任务。
                  </p>
                </li>
              </ol>
              <div className="paper-note">
                不催它，不会饿着，也不会走丢。没有盘缠，还有家常饭。
              </div>
            </div>
          )}
          {panel === "import" && (
            <>
              <p className="muted intro">
                选择之前导出的 JSON
                文件，或把存档文本贴在下面。先检查，再由你确认替换。
              </p>
              <input
                className="visually-hidden"
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > MAX_IMPORT_BYTES) {
                    setImportError("文件太大了，请选择 5 MB 以内的存档。");
                    return;
                  }
                  try {
                    const text = await file.text();
                    setImportText(text);
                    inspectImport(text);
                  } catch {
                    setImportError("没能读到这个文件，请再试一次。");
                  }
                  e.target.value = "";
                }}
              />
              <button
                className="secondary"
                onClick={() => fileInput.current?.click()}
              >
                选择存档文件
              </button>
              <label className="textarea-label" htmlFor="import-text">
                存档文本
              </label>
              <textarea
                id="import-text"
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportError("");
                }}
                placeholder="把导出的 JSON 存档贴在这里"
                spellCheck={false}
              />
              {importError && (
                <p className="error-message" role="alert">
                  {importError}
                </p>
              )}
              <button
                className="primary"
                disabled={!canReplace || !importText.trim()}
                onClick={() => inspectImport(importText)}
              >
                检查这份存档
              </button>
            </>
          )}
          {panel === "confirm" && candidate && (
            <>
              <div className="confirmation-icon">
                <Icon name="home" size={36} />
              </div>
              <p className="confirmation-title">
                {candidate.label === "重新开始一间小屋"
                  ? "这会从第一趟旅行重新开始。"
                  : "要用这份存档接着玩吗？"}
              </p>
              <dl className="save-summary">
                <dt>已有见闻</dt>
                <dd>{candidate.state.unlockedCards.length} / {CARDS.length} 张</dd>
                <dt>完成旅程</dt>
                <dd>{candidate.state.completed.length} 趟</dd>
                <dt>盘缠</dt>
                <dd>{candidate.state.coins} 文</dd>
                <dt>当前状态</dt>
                <dd>
                  {
                    {
                      home: "在家歇脚",
                      packed: "行囊备好",
                      traveling: "正在旅行",
                    }[candidate.state.phase]
                  }
                </dd>
              </dl>
              <div className="paper-note">
                当前进度会被替换。替换前会在本浏览器留一份恢复备份；稳妥起见，也可以先导出当前存档。
                {candidate.state.phase !== "home" &&
                  " 导入后会按已过去的时间结算这趟旅程。"}
              </div>
              <button
                className="primary"
                disabled={!canReplace}
                onClick={async () => {
                  try {
                    await replace(candidate.state);
                    setPanel(null);
                    setCandidate(null);
                    showToast("小屋收拾好了，接着慢慢玩。");
                  } catch (error) {
                    showToast((error as Error).message);
                  }
                }}
              >
                确认替换当前进度
              </button>
              <button
                className="secondary"
                onClick={() =>
                  download(
                    mode === "protected"
                      ? game.rawSave()
                      : game.exportCurrent(),
                  )
                }
              >
                先导出当前存档
              </button>
              <button
                className="text-button"
                onClick={() => setPanel("settings")}
              >
                算了，先不动
              </button>
            </>
          )}
          {toast && (
            <p className="sheet-toast" role="status">
              {toast}
            </p>
          )}
        </Sheet>
      )}
      {toast && !panel && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}

import { useEffect, useRef, useState } from "react";
import { advanceGame, newGame, nextEventAt, type GameState } from "./engine";
import {
  archiveBeforeReplace,
  DEBUG_SAVE_KEY,
  exportGame,
  isGameState,
  loadGame,
  previousGame,
  SAVE_KEY,
  saveGame,
} from "./storage";
const browserStorage = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) =>
    window.localStorage.setItem(key, value),
};
type Mode = "loading" | "owner" | "reader" | "protected";
export function useGame(debug: boolean) {
  const key = debug ? DEBUG_SAVE_KEY : SAVE_KEY;
  const [state, setState] = useState(() => newGame(Date.now()));
  const [mode, setMode] = useState<Mode>("loading");
  const [warning, setWarning] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "temporary">("saved");
  const stateRef = useRef(state);
  const modeRef = useRef<Mode>("loading");
  const offset = useRef(0);
  const savedAt = useRef(0);
  const clock = () => Date.now() + offset.current;
  function updateMode(value: Mode) {
    modeRef.current = value;
    setMode(value);
  }
  function commit(next: GameState, persist = true) {
    stateRef.current = next;
    if (persist) {
      const saved = saveGame(browserStorage, key, next);
      setSaveStatus(saved ? "saved" : "temporary");
      if (!saved)
        setWarning(
          "这次进度暂未保存。你可以继续玩，也请到设置里导出一份备份。",
        );
      savedAt.current = Date.now();
    }
    setState(next);
  }
  useEffect(() => {
    let active = true;
    let interval: ReturnType<typeof setInterval> | undefined;
    let release: (() => void) | undefined;
    const abort = new AbortController();
    const read = () => {
      const loaded = loadGame(browserStorage, key, Date.now());
      stateRef.current = loaded.state;
      setState(loaded.state);
      setWarning(loaded.warning);
      return loaded;
    };
    read();
    updateMode("reader");
    const sync = (event: StorageEvent) => {
      if (event.key === key && modeRef.current === "reader") read();
    };
    window.addEventListener("storage", sync);
    if (!navigator.locks) {
      setWarning(
        "此浏览器不支持安全的多窗口存档，请使用新版 Chrome、Safari 或 Edge。",
      );
      return () => window.removeEventListener("storage", sync);
    }
    navigator.locks
      .request(key + ":writer", { signal: abort.signal }, async () => {
        if (!active) return;
        const loaded = read();
        if (debug)
          offset.current = Math.max(0, loaded.state.lastSeenAt - Date.now());
        updateMode(loaded.blocked ? "protected" : "owner");
        if (!loaded.blocked) commit(advanceGame(loaded.state, clock()));
        const tick = () => {
          if (modeRef.current !== "owner") return;
          const previous = stateRef.current,
            next = advanceGame(previous, clock());
          const event =
            previous.phase !== next.phase ||
            previous.unlockedCards.length !== next.unlockedCards.length ||
            previous.souvenirCount !== next.souvenirCount ||
            JSON.stringify(previous.cardCollection) !==
              JSON.stringify(next.cardCollection);
          commit(next, event || Date.now() - savedAt.current >= 15000);
        };
        const flush = () => {
          if (modeRef.current === "owner")
            commit(advanceGame(stateRef.current, clock()));
        };
        interval = setInterval(tick, 1000);
        window.addEventListener("focus", tick);
        window.addEventListener("pagehide", flush);
        document.addEventListener("visibilitychange", flush);
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        window.removeEventListener("focus", tick);
        window.removeEventListener("pagehide", flush);
        document.removeEventListener("visibilitychange", flush);
      })
      .catch((error) => {
        if (active && error.name !== "AbortError")
          setWarning("暂时无法取得存档写入权限，这个窗口仅可查看。");
      });
    return () => {
      active = false;
      abort.abort();
      release?.();
      clearInterval(interval);
      window.removeEventListener("storage", sync);
    };
  }, [key, debug]);
  function act(action: (state: GameState, now: number) => GameState) {
    if (modeRef.current !== "owner")
      throw new Error(
        modeRef.current === "protected"
          ? "请先在设置里恢复存档。"
          : "这个窗口仅查看，请在原窗口操作。",
      );
    const now = clock();
    const current = advanceGame(stateRef.current, now);
    commit(current);
    commit(action(current, now));
  }
  function replace(next: GameState) {
    if (!["owner", "protected"].includes(modeRef.current))
      throw new Error("请在原试玩窗口恢复存档。");
    if (!isGameState(next))
      throw new Error("存档未通过检查，现有进度没有改变。");
    if (!archiveBeforeReplace(browserStorage, key))
      throw new Error(
        "无法保留现有进度，尚未替换。请先导出备份并检查存储空间。",
      );
    offset.current = debug ? Math.max(0, next.lastSeenAt - Date.now()) : 0;
    updateMode("owner");
    setWarning(null);
    commit(advanceGame(next, clock()));
  }
  function advanceDebug(milliseconds?: number) {
    if (!debug || modeRef.current !== "owner") return;
    const target =
      milliseconds === undefined
        ? nextEventAt(stateRef.current)
        : Math.max(clock(), stateRef.current.lastSeenAt) + milliseconds;
    if (target === null) return;
    offset.current = Math.max(offset.current, target - Date.now());
    commit(advanceGame(stateRef.current, clock()));
  }
  function rawSave() {
    try {
      return browserStorage.getItem(key) ?? exportGame(stateRef.current);
    } catch {
      return exportGame(stateRef.current);
    }
  }
  function previousSave() {
    return previousGame(browserStorage, key);
  }
  return {
    state,
    mode,
    warning,
    saveStatus,
    act,
    replace,
    advanceDebug,
    rawSave,
    previousSave,
    exportCurrent: () => exportGame(stateRef.current),
  };
}

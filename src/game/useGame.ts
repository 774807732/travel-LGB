import { useEffect, useRef, useState } from "react";
import { advanceGame, newGame, nextEventAt, type GameState } from "./engine";
import {
  archiveBeforeReplace, DEBUG_SAVE_KEY, exportGame, isGameState,
  loadGame, previousGame, SAVE_KEY, saveGame,
} from "./storage";
import {
  createBrowserWriter, NotWriterError, READER_NOTICE, STORAGE_NOTICE,
  WriterUnavailableError, type Writer,
} from "./writer";
const browserStorage = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
};
type Mode = "loading" | "owner" | "reader" | "protected" | "unavailable";
export function useGame(debug: boolean) {
  const key = debug ? DEBUG_SAVE_KEY : SAVE_KEY;
  const [state, setState] = useState(() => newGame(Date.now()));
  const [mode, setMode] = useState<Mode>("loading");
  const [warning, setWarning] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "temporary">("saved");
  const stateRef = useRef(state);
  const modeRef = useRef<Mode>("loading");
  const writerRef = useRef<Writer | null>(null);
  const offset = useRef(0);
  const savedAt = useRef(0);
  const clock = () => Date.now() + offset.current;
  function updateMode(value: Mode) {
    modeRef.current = value;
    setMode(value);
  }
  function showState(next: GameState) {
    stateRef.current = next;
    setState(next);
  }
  // 仅在 Writer.run 的同步回调内调用，先保存成功，再向界面报告成功。
  function commit(next: GameState, persist = true) {
    if (persist) {
      if (!saveGame(browserStorage, key, next)) {
        setSaveStatus("temporary");
        throw new WriterUnavailableError();
      }
      setSaveStatus("saved");
      savedAt.current = Date.now();
    }
    showState(next);
  }
  function read(readOnly = false) {
    if (!readOnly) {
      try { browserStorage.getItem(key); }
      catch { throw new WriterUnavailableError(); }
    }
    const loaded = loadGame(browserStorage, key, Date.now(), readOnly);
    showState(loaded.state);
    setWarning(loaded.warning);
    if (debug) offset.current = Math.max(offset.current, loaded.state.lastSeenAt - Date.now());
    return loaded;
  }
  function handleError(error: unknown) {
    if (error instanceof WriterUnavailableError) {
      updateMode("unavailable");
      setWarning(STORAGE_NOTICE);
    } else if (error instanceof NotWriterError) {
      updateMode("reader");
    }
  }
  async function guarded<T>(work: () => T) {
    const writer = writerRef.current;
    if (!writer || modeRef.current === "unavailable") throw new WriterUnavailableError();
    try {
      return await writer.run(() => {
        if (writerRef.current !== writer) throw new NotWriterError();
        return work();
      });
    } catch (error) {
      if (writerRef.current === writer) handleError(error);
      throw error;
    }
  }
  function writableState() {
    const loaded = read();
    if (loaded.blocked) {
      updateMode("protected");
      throw new Error("请先在设置里恢复存档。");
    }
    return loaded.state;
  }
  useEffect(() => {
    let active = true;
    let ticking = false;
    const tick = async (acquired = false) => {
      if (ticking || (!acquired && modeRef.current !== "owner")) return;
      ticking = true;
      try {
        await guarded(() => {
          if (!active) return;
          // 接续、休眠恢复及每次写入均重读最新存档，不能用过期窗口快照覆盖。
          const loaded = read();
          updateMode(loaded.blocked ? "protected" : "owner");
          if (loaded.blocked) return;
          const previous = loaded.state;
          const next = advanceGame(previous, clock());
          const event = previous.phase !== next.phase ||
            previous.unlockedCards.length !== next.unlockedCards.length ||
            previous.souvenirCount !== next.souvenirCount ||
            JSON.stringify(previous.cardCollection) !== JSON.stringify(next.cardCollection);
          commit(next, acquired || event || Date.now() - savedAt.current >= 15000);
        });
      } catch { /* guarded 已设置可解释的只读原因。 */ }
      finally { ticking = false; }
    };
    const start = () => {
      if (!active || writerRef.current) return;
      read(true);
      updateMode("reader");
      const writer = createBrowserWriter(key, (status) => {
        if (!active || writerRef.current !== writer) return;
        if (status === "owner") void tick(true);
        else {
          updateMode(status);
          if (status === "unavailable") setWarning(STORAGE_NOTICE);
        }
      });
      writerRef.current = writer;
    };
    const stop = () => {
      const writer = writerRef.current;
      writerRef.current = null;
      writer?.close();
      if (active) updateMode("reader");
    };
    const sync = (event: StorageEvent) => {
      if ((event.key === key || event.key === null) && modeRef.current === "reader") read(true);
    };
    const refresh = () => { void tick(); };
    start();
    const interval = setInterval(refresh, 1000);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", refresh);
    window.addEventListener("pagehide", stop);
    window.addEventListener("pageshow", start);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      stop();
      clearInterval(interval);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pagehide", stop);
      window.removeEventListener("pageshow", start);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [key, debug]);
  async function act(action: (state: GameState, now: number) => GameState) {
    if (modeRef.current === "unavailable") throw new WriterUnavailableError();
    if (modeRef.current === "protected") throw new Error("请先在设置里恢复存档。");
    if (modeRef.current !== "owner") throw new NotWriterError();
    return guarded(() => {
      const current = writableState();
      const now = clock();
      commit(action(advanceGame(current, now), now));
    });
  }
  async function replace(next: GameState) {
    if (modeRef.current === "unavailable") throw new WriterUnavailableError();
    if (!["owner", "protected"].includes(modeRef.current)) throw new NotWriterError();
    return guarded(() => {
      if (!isGameState(next)) throw new Error("存档未通过检查，现有进度没有改变。");
      if (!archiveBeforeReplace(browserStorage, key))
        throw new Error("无法保留现有进度，尚未替换。请先导出备份并检查存储空间。");
      offset.current = debug ? Math.max(0, next.lastSeenAt - Date.now()) : 0;
      commit(advanceGame(next, clock()));
      updateMode("owner");
      setWarning(null);
    });
  }
  async function advanceDebug(milliseconds?: number) {
    if (!debug || modeRef.current !== "owner") return;
    return guarded(() => {
      const current = writableState();
      const target = milliseconds === undefined ? nextEventAt(current)
        : Math.max(clock(), current.lastSeenAt) + milliseconds;
      if (target === null) return;
      offset.current = Math.max(offset.current, target - Date.now());
      commit(advanceGame(current, clock()));
    });
  }
  function rawSave() {
    try { return browserStorage.getItem(key) ?? exportGame(stateRef.current); }
    catch { return exportGame(stateRef.current); }
  }
  return {
    state, mode, warning, saveStatus,
    readOnlyNotice: mode === "unavailable" ? STORAGE_NOTICE : READER_NOTICE,
    act, replace, advanceDebug, rawSave,
    previousSave: () => previousGame(browserStorage, key),
    exportCurrent: () => exportGame(stateRef.current),
  };
}

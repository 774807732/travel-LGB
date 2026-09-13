/** 单写入者协调。HTTP 使用 IndexedDB 的排他事务，不用有竞态的 localStorage 抢锁。 */
export type WriterStatus = "owner" | "reader" | "unavailable";
export const READER_NOTICE = "另一窗口正在照看疙宝，这里只查看；关闭它后会自动接续。";
export const STORAGE_NOTICE = "浏览器存储暂不可用，已暂停操作以保护进度。请允许此网站存储后刷新，也可先导出备份。";
export const LEASE_MS = 12000;
export const HEARTBEAT_MS = 2000;
export class NotWriterError extends Error {
  constructor() { super(READER_NOTICE); }
}
export class WriterUnavailableError extends Error {
  constructor() { super(STORAGE_NOTICE); }
}
export interface Writer {
  run<T>(work: () => T): Promise<T>;
  close(): void;
}
type Lease = { owner: string; expires: number };
type Listener = (status: WriterStatus) => void;

export function openLeaseDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open("travel-toad-coordination", 1);
    let abandoned = false;
    const fail = () => { abandoned = true; reject(new WriterUnavailableError()); };
    const timeout = setTimeout(fail, 5000);
    request.onupgradeneeded = () => request.result.createObjectStore("writers");
    request.onerror = request.onblocked = () => { clearTimeout(timeout); fail(); };
    request.onsuccess = () => {
      clearTimeout(timeout);
      if (abandoned) { request.result.close(); return; }
      resolve(request.result);
    };
  });
}

function transaction<T>(
  db: IDBDatabase,
  key: string,
  work: (lease: Lease | undefined, put: (lease: Lease | null) => void) => T,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let tx: IDBTransaction;
    try { tx = db.transaction("writers", "readwrite"); }
    catch { reject(new WriterUnavailableError()); return; }
    const store = tx.objectStore("writers");
    const request = store.get(key);
    let result: T;
    let failure: unknown;
    let failed = false;
    // 回调必须同步执行；核验租约与 localStorage 写入处于同一个排他事务内。
    request.onsuccess = () => {
      try {
        result = work(request.result, (lease) => {
          if (lease) store.put(lease, key);
          else store.delete(key);
        });
      } catch (error) { failed = true; failure = error; }
    };
    tx.oncomplete = () => failed ? reject(failure) : resolve(result);
    tx.onabort = () => reject(new WriterUnavailableError());
    tx.onerror = () => {}; // 统一由 abort 处理；业务异常不伪装成存储故障。
  });
}

export function createLeaseWriter(
  db: IDBDatabase,
  key: string,
  owner: string,
  onStatus: Listener,
  now = Date.now,
) {
  let closed = false;
  let status: WriterStatus = "reader";
  let polling: Promise<void> | undefined;
  function notify(next: WriterStatus) {
    if (closed || next === status) return;
    status = next;
    onStatus(next);
  }
  async function poll() {
    if (closed || status === "unavailable") return;
    if (polling) return polling;
    polling = transaction(db, key, (lease, put) => {
      if (closed) return false;
      const time = now();
      if (lease && lease.owner !== owner && lease.expires > time) return false;
      put({ owner, expires: time + LEASE_MS });
      return true;
    }).then((owns) => notify(owns ? "owner" : "reader"))
      .catch(() => notify("unavailable"))
      .finally(() => { polling = undefined; });
    return polling;
  }
  const writer: Writer & { poll: () => Promise<void> } = {
    poll,
    async run<T>(work: () => T) {
      if (status === "unavailable") throw new WriterUnavailableError();
      if (closed || status !== "owner") throw new NotWriterError();
      try {
        return await transaction(db, key, (lease, put) => {
          if (closed || !lease || lease.owner !== owner || lease.expires <= now())
            throw new NotWriterError();
          put({ owner, expires: now() + LEASE_MS });
          return work();
        });
      } catch (error) {
        if (error instanceof NotWriterError) notify("reader");
        if (error instanceof WriterUnavailableError) notify("unavailable");
        throw error;
      }
    },
    close() {
      if (closed) return;
      closed = true;
      // 只释放自己的租约；异常关闭则最多等待租约到期，不能删除接替者的锁。
      void transaction(db, key, (lease, put) => {
        if (lease?.owner === owner) put(null);
      }).catch(() => {}).finally(() => db.close());
    },
  };
  return writer;
}

export function createBrowserWriter(key: string, onStatus: Listener): Writer {
  let closed = false;
  let held = false;
  let failed = false;
  let release: (() => void) | undefined;
  let fallback: ReturnType<typeof createLeaseWriter> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const abort = new AbortController();
  if (navigator.locks) {
    void navigator.locks.request(key + ":writer", { signal: abort.signal }, async () => {
      if (closed) return;
      held = true;
      const waiting = new Promise<void>((resolve) => { release = resolve; });
      onStatus("owner");
      await waiting;
      held = false;
    }).catch(() => {
      if (!closed) { failed = true; onStatus("unavailable"); }
    });
  } else {
    void (async () => {
      try {
        const db = await openLeaseDatabase(window.indexedDB);
        if (closed) { db.close(); return; }
        const id = Array.from(crypto.getRandomValues(new Uint32Array(4))).join("-");
        fallback = createLeaseWriter(db, key, id, onStatus);
        db.onversionchange = () => {
          fallback?.close();
          if (!closed) { failed = true; onStatus("unavailable"); }
        };
        heartbeat = setInterval(() => { void fallback?.poll(); }, HEARTBEAT_MS);
        await fallback.poll();
      } catch {
        if (!closed) { failed = true; onStatus("unavailable"); }
      }
    })();
  }
  return {
    async run<T>(work: () => T) {
      if (closed) throw new NotWriterError();
      if (failed) throw new WriterUnavailableError();
      if (fallback) return fallback.run(work);
      if (!held) throw new NotWriterError();
      // Web Lock 持有期间同步写入，避免校验与提交之间被异步操作打断。
      return work();
    },
    close() {
      closed = true;
      held = false;
      abort.abort();
      release?.();
      clearInterval(heartbeat);
      fallback?.close();
    },
  };
}

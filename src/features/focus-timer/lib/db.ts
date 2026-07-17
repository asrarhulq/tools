/**
 * Durable, offline persistence for the focus timer built on **IndexedDB**.
 *
 * Why not just localStorage? localStorage is synchronous, ~5MB-capped, and is
 * the first thing browsers evict under storage pressure — a poor home for
 * months (or years) of session history. IndexedDB gives us a much larger quota,
 * async access that never blocks the timer's animation frame, and better
 * durability. We keep a tiny localStorage mirror of *settings* only (small,
 * read once at boot) so the first paint can theme instantly; the heavy session
 * log lives exclusively in IndexedDB.
 *
 * This module has **no React** — it's a plain async API the store awaits. All
 * calls degrade gracefully (returning defaults / no-ops) when IndexedDB is
 * unavailable (SSR, private-mode quirks), so the tool always renders.
 */

import type { SessionRecord, Settings } from "../types";

const DB_NAME = "asrarul-tools:focus";
const DB_VERSION = 1;
const STORE_SESSIONS = "sessions";
const STORE_META = "meta"; // key/value: settings, migration flags

// Legacy localStorage keys (v1 of the tool). We migrate these once into IDB.
const LEGACY_SETTINGS_KEY = "asrarul-tools:focus:settings:v1";
const LEGACY_STATS_KEY = "asrarul-tools:focus:sessions:v1";

// A small settings mirror kept in localStorage for instant first paint.
const SETTINGS_MIRROR_KEY = "asrarul-tools:focus:settings:mirror:v2";

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        // Keyed by the session's ISO timestamp (`at`); an index on the day key
        // isn't needed — we read the whole log and derive stats in memory.
        db.createObjectStore(STORE_SESSIONS, { keyPath: "at" });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
  return dbPromise;
}

function tx(
  db: IDBDatabase,
  store: string,
  mode: IDBTransactionMode,
): IDBObjectStore {
  return db.transaction(store, mode).objectStore(store);
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Settings ────────────────────────────────────────────────────────────────

/** Synchronous best-effort read of the settings mirror for instant first paint. */
export function readSettingsMirror(): Partial<Settings> | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(SETTINGS_MIRROR_KEY) ??
      localStorage.getItem(LEGACY_SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as Partial<Settings>) : null;
  } catch {
    return null;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  // Mirror to localStorage (fast boot) + persist to IDB (durable).
  try {
    localStorage.setItem(SETTINGS_MIRROR_KEY, JSON.stringify(settings));
  } catch {
    /* non-fatal */
  }
  const db = await openDb();
  if (!db) return;
  try {
    await reqToPromise(
      tx(db, STORE_META, "readwrite").put(settings, "settings"),
    );
  } catch {
    /* non-fatal */
  }
}

export async function loadSettings(): Promise<Partial<Settings> | null> {
  const db = await openDb();
  if (!db) return readSettingsMirror();
  try {
    const s = await reqToPromise(
      tx(db, STORE_META, "readonly").get("settings"),
    );
    return (s as Partial<Settings> | undefined) ?? readSettingsMirror();
  } catch {
    return readSettingsMirror();
  }
}

// ── Sessions ──────────────────────────────────────────────────────────────

export async function loadSessions(): Promise<SessionRecord[]> {
  const db = await openDb();
  if (!db) return [];
  try {
    const all = await reqToPromise(
      tx(db, STORE_SESSIONS, "readonly").getAll() as IDBRequest<
        SessionRecord[]
      >,
    );
    // Stored keyed by `at`, so getAll() returns ascending by timestamp already.
    return all ?? [];
  } catch {
    return [];
  }
}

/** Append a single session (the hot path — one small put, no full rewrite). */
export async function addSession(rec: SessionRecord): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    await reqToPromise(tx(db, STORE_SESSIONS, "readwrite").put(rec));
  } catch {
    /* non-fatal */
  }
}

/** Replace the entire session log (used by import + clear). */
export async function replaceSessions(recs: SessionRecord[]): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    const store = tx(db, STORE_SESSIONS, "readwrite");
    await reqToPromise(store.clear());
    for (const r of recs) store.put(r);
    await new Promise<void>((resolve, reject) => {
      store.transaction.oncomplete = () => resolve();
      store.transaction.onerror = () => reject(store.transaction.error);
    });
  } catch {
    /* non-fatal */
  }
}

export async function clearSessions(): Promise<void> {
  await replaceSessions([]);
}

// ── One-time migration from the v1 localStorage layout ──────────────────────

export async function migrateLegacy(): Promise<void> {
  if (typeof localStorage === "undefined") return;
  const db = await openDb();
  if (!db) return;
  try {
    const done = await reqToPromise(
      tx(db, STORE_META, "readonly").get("migrated:v1"),
    );
    if (done) return;

    const rawSess = localStorage.getItem(LEGACY_STATS_KEY);
    if (rawSess) {
      const sessions = JSON.parse(rawSess) as SessionRecord[];
      if (Array.isArray(sessions) && sessions.length) {
        const store = tx(db, STORE_SESSIONS, "readwrite");
        for (const s of sessions) if (s?.at) store.put(s);
        await new Promise<void>((resolve) => {
          store.transaction.oncomplete = () => resolve();
          store.transaction.onerror = () => resolve();
        });
      }
    }
    await reqToPromise(
      tx(db, STORE_META, "readwrite").put(true, "migrated:v1"),
    );
    // Leave the legacy keys in place as a safety copy; they're tiny.
  } catch {
    /* non-fatal — the tool still works from whatever loaded */
  }
}

// ── Export / Import backup ──────────────────────────────────────────────────

export interface BackupFile {
  app: "asrarul-tools:focus";
  version: 2;
  exportedAt: string;
  settings: Settings;
  sessions: SessionRecord[];
}

export function buildBackup(
  settings: Settings,
  sessions: SessionRecord[],
  exportedAt: string,
): BackupFile {
  return {
    app: "asrarul-tools:focus",
    version: 2,
    exportedAt,
    settings,
    sessions,
  };
}

export interface ParsedBackup {
  settings?: Partial<Settings>;
  sessions: SessionRecord[];
}

/** Validate + normalise an imported backup file. Throws on an invalid shape. */
export function parseBackup(json: unknown): ParsedBackup {
  if (!json || typeof json !== "object") {
    throw new Error("Not a valid backup file.");
  }
  const obj = json as Partial<BackupFile>;
  if (obj.app !== "asrarul-tools:focus") {
    throw new Error("This file isn't a focus-timer backup.");
  }
  const sessions = Array.isArray(obj.sessions)
    ? obj.sessions.filter(
        (s): s is SessionRecord =>
          !!s &&
          typeof s.at === "string" &&
          typeof s.elapsed === "number" &&
          typeof s.completed === "boolean",
      )
    : [];
  return { settings: obj.settings, sessions };
}

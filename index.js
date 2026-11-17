/**
 * Host half of the "待办与随手记" page.
 *
 * This half owns the durable copy of the page's data and its location.
 *
 * Storage is a local database: one `todos.db` (SQLite, WAL) holding
 *  - `items`  — one row per entry, with the entry document as JSON plus
 *               indexed columns (`day`, `created_at`, `done`, `progress`) so
 *               day and state queries do not scan the whole table;
 *  - `notes`  — the per-day summaries the user kept;
 *  - `events` — the activity log, queryable by day instead of grepped;
 *  - `meta`   — bookkeeping, such as where the data was imported from.
 *
 * Writes are row-level and transactional: the browser sends the entries that
 * changed, and one transaction applies them with prepared statements. That is
 * what replaces the old "rewrite the whole JSON document, append a journal,
 * fold the journal" cycle — its cost grew with the total size of the data
 * rather than with what actually changed.
 *
 * If the runtime cannot provide `node:sqlite`, an equivalent JSON backend
 * (snapshot + journal) takes over so the page keeps working; the active backend
 * is reported to the page.
 *
 * The directory holding the database is configurable: `location.json` next to
 * the Harness home stores the chosen directory, and the data files move with
 * it. Everything is registered on this plugin's context, so unloading the
 * plugin removes the routes and closes the databases.
 *
 * @module @dsh-local/view-a0796f38-40ab-4c7e-8c72-872b90ddd567
 */
import { appendFile, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, normalize } from 'node:path'

/** Cordis function-plugin name. */
export const name = 'todo-notes'

/** The route carrier; the trust fence is read from `connection` per request. */
export const inject = ['webServer']

/** Folder under the Harness home that holds this plugin's own bookkeeping. */
const SLUG = 'todo-notes'
/** Every route of this plugin lives under this path. */
const ROUTE = '/dsh-todo-notes'
/** Document version written by the browser half. */
const SCHEMA_VERSION = 3
/** Version of the database layout, kept in SQLite's `user_version`. */
const DB_SCHEMA_VERSION = 1
/** Identifies this plugin's databases, kept in SQLite's `application_id`. */
const DB_APPLICATION_ID = 0x44544e31 // "DTN1"
/** Request-body ceiling. */
const MAX_BODY_BYTES = 8 * 1024 * 1024
/** How many activity records one write may append to the history log. */
const MAX_EVENTS_PER_WRITE = 200
/** Journal lines allowed before the JSON fallback is folded into a snapshot. */
const JOURNAL_FLUSH_LINES = 400
/** Journal bytes allowed before the same fold; bounds a few very large edits. */
const JOURNAL_FLUSH_BYTES = 256 * 1024
/** The database and the sidecars WAL leaves beside it. */
const DB_FILES = ['todos.db', 'todos.db-wal', 'todos.db-shm']
/** The files the JSON fallback uses. */
const JSON_FILES = ['todos.json', 'journal.jsonl', 'history.jsonl']
/** Everything that travels with the data directory. */
const DATA_FILES = [...DB_FILES, ...JSON_FILES]

/** Answer a JSON body. */
function sendJson(res, status, value) {
  const body = JSON.stringify(value)
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(body)
}

/** Answer a rejection for an untrusted caller; true when the request was refused. */
function rejected(ctx, req, res) {
  const connection = ctx.get('connection')
  if (connection === undefined || typeof connection.requestRejection !== 'function') return false
  const rejection = connection.requestRejection(req)
  if (rejection === undefined) return false
  res.statusCode = rejection
  res.end()
  return true
}

/** Read and parse one request body; rejects on a malformed or oversized body. */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch (error) {
        reject(new Error('invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

/**
 * Resolve the Harness home.
 *
 * `app-boot` provides `dshHomePath` on the context; the fallback repeats the
 * documented resolution order (explicit, `$DSH_HOME`, then `~/.dsh`) so this
 * plugin keeps working in a composition without that provider.
 *
 * @param ctx - Host context.
 * @returns Absolute Harness home directory.
 */
function harnessHome(ctx) {
  if (typeof ctx.dshHomePath === 'function') {
    try {
      const resolved = ctx.dshHomePath()
      if (typeof resolved === 'string' && resolved !== '') return resolved
    } catch (error) {
      // Fall through to the environment-based resolution below.
    }
  }
  const configured = typeof process.env.DSH_HOME === 'string' ? process.env.DSH_HOME.trim() : ''
  return configured !== '' ? configured : join(homedir(), '.dsh')
}

async function exists(file) {
  try {
    await stat(file)
    return true
  } catch (error) {
    return false
  }
}

async function stampOf(file) {
  try {
    const info = await stat(file)
    return info.size + '@' + info.mtimeMs
  } catch (error) {
    return 'absent'
  }
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** Every path one save touches, for the configured or the default directory. */
async function resolvePaths(ctx) {
  const homeDir = join(harnessHome(ctx), SLUG)
  const defaultDirectory = join(homeDir, 'data')
  const locationFile = join(homeDir, 'location.json')
  let configured = null
  try {
    const parsed = JSON.parse(await readFile(locationFile, 'utf8'))
    if (parsed !== null && typeof parsed === 'object'
      && typeof parsed.directory === 'string' && isAbsolute(parsed.directory)) {
      configured = normalize(parsed.directory)
    }
  } catch (error) {
    // No location file, or an unreadable one: the default directory applies.
  }
  const directory = configured === null ? defaultDirectory : configured
  return {
    homeDir,
    locationFile,
    configured,
    directory,
    defaultDirectory,
    dbFile: join(directory, 'todos.db'),
    snapshotFile: join(directory, 'todos.json'),
    journalFile: join(directory, 'journal.jsonl'),
    historyFile: join(directory, 'history.jsonl'),
  }
}

/* ------------------------------------------------------------ sqlite half -- */

let sqliteModule = null
let sqliteFailure = null

/** Import `node:sqlite` once; a missing module is a fact the caller can report. */
async function loadSqlite() {
  if (sqliteModule !== null || sqliteFailure !== null) return sqliteModule
  try {
    sqliteModule = await import('node:sqlite')
  } catch (error) {
    sqliteFailure = error instanceof Error ? error.message : String(error)
  }
  return sqliteModule
}

/** SQLite binds only null, numbers, bigints, strings and buffers. */
function bindable(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'string' || typeof value === 'bigint') return value
  return null
}

/** The columns an entry is queried by, taken from its document. */
function itemColumns(item) {
  return {
    day: typeof item.day === 'string' ? item.day : null,
    createdAt: isFiniteNumber(item.createdAt) ? item.createdAt : null,
    done: item.done === true ? 1 : 0,
    completedAt: isFiniteNumber(item.completedAt) ? item.completedAt : null,
    progress: isFiniteNumber(item.progress) ? item.progress : null,
  }
}

/**
 * Create the layout in an empty database, or verify one we already own.
 *
 * A database without our application id that already holds tables belongs to
 * something else and is left alone.
 */
function ensureSchema(db) {
  const { application_id: applicationId } = db.prepare('PRAGMA application_id').get()
  const userTables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT GLOB 'sqlite_*'")
    .all()
    .map((row) => row.name)
  if (applicationId !== 0 && applicationId !== DB_APPLICATION_ID) {
    throw new Error('database belongs to another application')
  }
  if (applicationId === 0 && userTables.length > 0) {
    throw new Error('database is not this plugin\'s own')
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id           TEXT PRIMARY KEY,
      doc          TEXT NOT NULL,
      day          TEXT,
      created_at   INTEGER,
      done         INTEGER NOT NULL DEFAULT 0,
      completed_at INTEGER,
      progress     INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_items_day ON items(day);
    CREATE INDEX IF NOT EXISTS idx_items_done ON items(done);
    CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at);
    CREATE TABLE IF NOT EXISTS notes (
      day        TEXT PRIMARY KEY,
      text       TEXT NOT NULL,
      updated_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS events (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      at     INTEGER,
      day    TEXT,
      kind   TEXT,
      detail TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_events_day ON events(day);
    CREATE INDEX IF NOT EXISTS idx_events_at ON events(at);
    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `)
  if (applicationId === 0) db.exec('PRAGMA application_id = ' + DB_APPLICATION_ID)
  db.exec('PRAGMA user_version = ' + DB_SCHEMA_VERSION)
}

/** Statements reused across writes; preparing them once keeps saves cheap. */
function prepared(store, sql) {
  const found = store.statements.get(sql)
  if (found !== undefined) return found
  const statement = store.db.prepare(sql)
  store.statements.set(sql, statement)
  return statement
}

const SQL_UPSERT_ITEM = `
  INSERT INTO items (id, doc, day, created_at, done, completed_at, progress)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    doc = excluded.doc, day = excluded.day, created_at = excluded.created_at,
    done = excluded.done, completed_at = excluded.completed_at, progress = excluded.progress
`
const SQL_INSERT_EVENT = 'INSERT INTO events (at, day, kind, detail) VALUES (?, ?, ?, ?)'

function writeItem(store, item) {
  const columns = itemColumns(item)
  prepared(store, SQL_UPSERT_ITEM).run(
    bindable(item.id),
    JSON.stringify(item),
    bindable(columns.day),
    bindable(columns.createdAt),
    bindable(columns.done),
    bindable(columns.completedAt),
    bindable(columns.progress),
  )
}

function replaceNotes(store, notes) {
  const db = store.db
  db.exec('DELETE FROM notes')
  const insert = prepared(store, 'INSERT INTO notes (day, text, updated_at) VALUES (?, ?, ?)')
  const now = Date.now()
  for (const [day, text] of Object.entries(notes)) {
    if (typeof text !== 'string') continue
    insert.run(bindable(day), text, now)
  }
}

function insertEvents(store, events) {
  if (!Array.isArray(events)) return 0
  const insert = prepared(store, SQL_INSERT_EVENT)
  let written = 0
  for (const event of events) {
    if (!isPlainObject(event)) continue
    if (written >= MAX_EVENTS_PER_WRITE) break
    insert.run(
      bindable(isFiniteNumber(event.at) ? event.at : Date.now()),
      bindable(typeof event.day === 'string' ? event.day : null),
      bindable(typeof event.kind === 'string' ? event.kind : null),
      JSON.stringify(event),
    )
    written += 1
  }
  return written
}

/** Run `body` in one transaction, rolling back so a failed write leaves no trace. */
function inTransaction(db, body) {
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = body()
    db.exec('COMMIT')
    return result
  } catch (error) {
    try {
      db.exec('ROLLBACK')
    } catch (rollbackError) {
      // The transaction is already gone; the original error is the useful one.
    }
    throw error
  }
}

/** Apply the browser's row-level changes: the normal, incremental write. */
function applyOps(store, ops) {
  const db = store.db
  return inTransaction(db, () => {
    let put = 0
    let del = 0
    let notes = 0
    for (const op of ops) {
      if (!isPlainObject(op)) continue
      if (op.t === 'put' && isPlainObject(op.v) && typeof op.v.id === 'string') {
        writeItem(store, op.v)
        put += 1
        continue
      }
      if (op.t === 'del' && typeof op.id === 'string') {
        prepared(store, 'DELETE FROM items WHERE id = ?').run(bindable(op.id))
        del += 1
        continue
      }
      if (op.t === 'notes' && isPlainObject(op.v)) {
        replaceNotes(store, op.v)
        notes += 1
      }
    }
    return { put, del, notes }
  })
}

/**
 * Apply a whole document, for a caller that still sends one.
 *
 * Rows missing from the document are removed, so this stays a true reconcile;
 * it is kept for compatibility and costs the size of the document.
 */
function applyDocument(store, items, notes) {
  const db = store.db
  return inTransaction(db, () => {
    // The scratch table has to exist before its statement can be prepared.
    db.exec('CREATE TEMP TABLE IF NOT EXISTS seen (id TEXT PRIMARY KEY)')
    db.exec('DELETE FROM seen')
    const seen = prepared(store, 'INSERT INTO seen (id) VALUES (?) ON CONFLICT(id) DO NOTHING')
    let put = 0
    for (const item of items) {
      if (!isPlainObject(item) || typeof item.id !== 'string') continue
      writeItem(store, item)
      seen.run(bindable(item.id))
      put += 1
    }
    const removed = prepared(store, 'DELETE FROM items WHERE id NOT IN (SELECT id FROM seen)').run()
    replaceNotes(store, notes)
    return { put, del: Number(removed.changes ?? 0), notes: 1 }
  })
}

function readItems(store) {
  const rows = store.db
    .prepare('SELECT doc FROM items ORDER BY created_at IS NULL, created_at, id')
    .all()
  const items = []
  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.doc)
      if (isPlainObject(parsed) && typeof parsed.id === 'string') items.push(parsed)
    } catch (error) {
      // One unreadable row must not hide the rest of the list.
    }
  }
  return items
}

function readNotes(store) {
  const notes = {}
  for (const row of store.db.prepare('SELECT day, text FROM notes').all()) notes[row.day] = row.text
  return notes
}

function countEvents(store) {
  const row = store.db.prepare('SELECT COUNT(*) AS n FROM events').get()
  if (row === undefined || row === null) return 0
  return Number(row.n ?? 0)
}

/**
 * Bring the old JSON files into the database, once.
 *
 * The snapshot is imported, the journal replays on top of it, and the history
 * log becomes rows in `events`. The originals are renamed rather than deleted,
 * so nothing is lost if the import is questioned.
 */
async function importLegacy(store, paths) {
  const db = store.db
  const existing = db.prepare('SELECT COUNT(*) AS n FROM items').get()
  if (Number(existing?.n ?? 0) > 0) return null
  const already = db.prepare('SELECT value FROM meta WHERE key = ?').get('importedFrom')
  if (already !== undefined) return null
  if (!(await exists(paths.snapshotFile))) return null

  const items = new Map()
  let notes = {}
  let snapshotted = false
  let corrupt = false
  try {
    const parsed = JSON.parse(await readFile(paths.snapshotFile, 'utf8'))
    if (isPlainObject(parsed) && Array.isArray(parsed.items)) {
      for (const item of parsed.items) {
        if (isPlainObject(item) && typeof item.id === 'string') items.set(item.id, item)
      }
      if (isPlainObject(parsed.notes)) notes = parsed.notes
      snapshotted = true
    } else {
      corrupt = true
    }
  } catch (error) {
    corrupt = true
  }
  if (corrupt && items.size === 0) return null

  let journalOps = 0
  try {
    const raw = await readFile(paths.journalFile, 'utf8')
    for (const line of raw.split('\n')) {
      const text = line.trim()
      if (text === '') continue
      let op = null
      try {
        op = JSON.parse(text)
      } catch (error) {
        continue
      }
      if (!isPlainObject(op)) continue
      if (op.t === 'put' && isPlainObject(op.v) && typeof op.v.id === 'string') items.set(op.v.id, op.v)
      else if (op.t === 'del' && typeof op.id === 'string') items.delete(op.id)
      else if (op.t === 'notes' && isPlainObject(op.v)) notes = op.v
      journalOps += 1
    }
  } catch (error) {
    // No journal: the snapshot is the whole story.
  }

  const events = []
  try {
    const raw = await readFile(paths.historyFile, 'utf8')
    for (const line of raw.split('\n')) {
      const text = line.trim()
      if (text === '') continue
      try {
        events.push(JSON.parse(text))
      } catch (error) {
        // A torn line is skipped.
      }
    }
  } catch (error) {
    // No history log.
  }

  inTransaction(db, () => {
    for (const item of items.values()) writeItem(store, item)
    replaceNotes(store, notes)
    insertEvents(store, events)
    db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
      .run('importedFrom', JSON.stringify({ at: Date.now(), items: items.size, journalOps, events: events.length }))
  })

  const renamed = []
  for (const name of JSON_FILES) {
    const from = join(paths.directory, name)
    if (!(await exists(from))) continue
    try {
      await rename(from, from + '.imported-bak')
      renamed.push(name)
    } catch (error) {
      // The data is already in the database; a file left behind is harmless.
    }
  }

  return { items: items.size, journalOps, events: events.length, renamed, snapshotted }
}

async function openSqliteStore(paths) {
  const { DatabaseSync } = await loadSqlite()
  await mkdir(paths.directory, { recursive: true })
  const db = new DatabaseSync(paths.dbFile)
  let opened = false
  try {
    db.exec('PRAGMA journal_mode = WAL')
    db.exec('PRAGMA synchronous = NORMAL')
    db.exec('PRAGMA busy_timeout = 5000')
    ensureSchema(db)
    opened = true
  } finally {
    if (!opened) db.close()
  }
  const store = { backend: 'sqlite', db, statements: new Map(), migrated: null }
  store.migrated = await importLegacy(store, paths)
  return store
}

/* -------------------------------------------------------------- json half -- */

/**
 * The JSON backend: `todos.json` plus `journal.jsonl` plus `history.jsonl`.
 *
 * It is kept as the fallback for a runtime whose `node:sqlite` is missing, and
 * it is the code path that the database's legacy import replaces.
 */
async function openJsonStore(paths) {
  const store = {
    backend: 'json',
    fingerprint: '',
    items: new Map(),
    notes: {},
    journalLines: 0,
    journalBytes: 0,
    persisted: false,
    corrupt: false,
    migrated: null,
  }

  store.fingerprint = (await stampOf(paths.snapshotFile)) + '|' + (await stampOf(paths.journalFile))

  try {
    const parsed = JSON.parse(await readFile(paths.snapshotFile, 'utf8'))
    if (isPlainObject(parsed) && Array.isArray(parsed.items)) {
      for (const item of parsed.items) {
        if (isPlainObject(item) && typeof item.id === 'string') store.items.set(item.id, item)
      }
      if (isPlainObject(parsed.notes)) store.notes = parsed.notes
      store.persisted = true
    } else {
      // The bytes stay on disk untouched; the page opens empty and says so.
      store.corrupt = true
    }
  } catch (error) {
    if (error === null || typeof error !== 'object' || error.code !== 'ENOENT') store.corrupt = true
  }

  try {
    const raw = await readFile(paths.journalFile, 'utf8')
    store.journalBytes = Buffer.byteLength(raw)
    for (const line of raw.split('\n')) {
      const text = line.trim()
      if (text === '') continue
      store.journalLines += 1
      try {
        applyJsonOp(store, JSON.parse(text))
      } catch (error) {
        // A torn final line is skipped; the next snapshot heals the file.
      }
    }
  } catch (error) {
    // No journal yet.
  }

  return store
}

function applyJsonOp(store, op) {
  if (!isPlainObject(op)) return
  if (op.t === 'put' && isPlainObject(op.v) && typeof op.v.id === 'string') {
    store.items.set(op.v.id, op.v)
    return
  }
  if (op.t === 'del' && typeof op.id === 'string') {
    store.items.delete(op.id)
    return
  }
  if (op.t === 'notes' && isPlainObject(op.v)) store.notes = op.v
}

/** The changes a posted document introduces, so only those reach the disk. */
function jsonDiffOps(store, items, notes) {
  const ops = []
  const seen = new Set()
  for (const item of items) {
    if (!isPlainObject(item) || typeof item.id !== 'string') continue
    seen.add(item.id)
    const previous = store.items.get(item.id)
    if (previous === undefined || JSON.stringify(previous) !== JSON.stringify(item)) ops.push({ t: 'put', v: item })
  }
  for (const id of store.items.keys()) {
    if (!seen.has(id)) ops.push({ t: 'del', id })
  }
  if (JSON.stringify(store.notes) !== JSON.stringify(notes)) ops.push({ t: 'notes', v: notes })
  return ops
}

/** Replace the snapshot atomically and drop the journal it now includes. */
async function writeJsonSnapshot(paths, store) {
  await mkdir(paths.directory, { recursive: true })
  const document = {
    version: SCHEMA_VERSION,
    updatedAt: Date.now(),
    items: Array.from(store.items.values()),
    notes: store.notes,
  }
  const temporary = paths.snapshotFile + '.tmp'
  await writeFile(temporary, JSON.stringify(document, null, 2), 'utf8')
  await rename(temporary, paths.snapshotFile)
  await rm(paths.journalFile, { force: true })
  store.journalLines = 0
  store.journalBytes = 0
  store.persisted = true
}

/** Append activity records; one JSON object per line keeps past days greppable. */
async function appendJsonHistory(paths, events) {
  const lines = []
  if (Array.isArray(events)) {
    for (const event of events) {
      if (!isPlainObject(event)) continue
      lines.push(JSON.stringify(event))
      if (lines.length >= MAX_EVENTS_PER_WRITE) break
    }
  }
  if (lines.length === 0) return 0
  await mkdir(paths.directory, { recursive: true })
  await appendFile(paths.historyFile, lines.join('\n') + '\n', 'utf8')
  return lines.length
}

async function jsonWrite(paths, store, payload) {
  const items = Array.isArray(payload.items) ? payload.items : []
  const notes = isPlainObject(payload.notes) ? payload.notes : {}
  const ops = jsonDiffOps(store, items, notes)
  let appended = 0
  let snapshotWritten = false

  if (store.persisted !== true) {
    // First save into this directory: one readable snapshot and no journal.
    for (const op of ops) applyJsonOp(store, op)
    await writeJsonSnapshot(paths, store)
    snapshotWritten = true
  } else if (ops.length > 0) {
    await mkdir(paths.directory, { recursive: true })
    const text = ops.map((op) => JSON.stringify(op)).join('\n') + '\n'
    await appendFile(paths.journalFile, text, 'utf8')
    for (const op of ops) applyJsonOp(store, op)
    store.journalLines += ops.length
    store.journalBytes += Buffer.byteLength(text)
    appended = ops.length
  }

  if (store.persisted === true && !snapshotWritten
    && (store.journalLines >= JOURNAL_FLUSH_LINES || store.journalBytes >= JOURNAL_FLUSH_BYTES)) {
    await writeJsonSnapshot(paths, store)
    snapshotWritten = true
  }

  store.fingerprint = (await stampOf(paths.snapshotFile)) + '|' + (await stampOf(paths.journalFile))
  return { appended, snapshotWritten, put: 0, del: 0 }
}

/* ------------------------------------------------------------ the store -- */

/** One open database per data directory. */
const stores = new Map()

/**
 * Open (or reuse) the store for a directory.
 *
 * A database that cannot be opened falls back to the JSON backend rather than
 * taking the page down; the reason travels to the page in `storageNote`.
 */
async function openStore(paths) {
  const cached = stores.get(paths.directory)
  if (cached !== undefined) return cached

  const sqlite = await loadSqlite()
  if (sqlite !== null) {
    try {
      const store = await openSqliteStore(paths)
      stores.set(paths.directory, store)
      return store
    } catch (error) {
      const store = await openJsonStore(paths)
      store.storageNote = 'sqlite unavailable: ' + (error instanceof Error ? error.message : String(error))
      stores.set(paths.directory, store)
      return store
    }
  }

  const store = await openJsonStore(paths)
  store.storageNote = 'node:sqlite is not available in this runtime: ' + String(sqliteFailure ?? '')
  stores.set(paths.directory, store)
  return store
}

/** Close one directory's database, checkpointing WAL on the way out. */
function closeStore(directory) {
  const store = stores.get(directory)
  if (store === undefined) return
  stores.delete(directory)
  if (store.backend === 'sqlite' && store.db !== undefined) {
    try {
      store.db.exec('PRAGMA wal_checkpoint(TRUNCATE)')
    } catch (error) {
      // A failed checkpoint is not worth blocking the close.
    }
    try {
      store.db.close()
    } catch (error) {
      // Already closed.
    }
  }
}

function closeAllStores() {
  for (const directory of Array.from(stores.keys())) closeStore(directory)
}

/* ------------------------------------------------------------- writing -- */

/**
 * Apply one save, whichever shape the caller sent.
 *
 * `ops` is the incremental path the page uses; a full `items` document is still
 * accepted so an older client keeps working.
 */
async function writeStore(paths, store, payload) {
  const events = Array.isArray(payload.events) ? payload.events : []

  if (store.backend === 'sqlite') {
    if (Array.isArray(payload.ops)) {
      const applied = applyOps(store, payload.ops)
      const written = insertEvents(store, events)
      return {
        mode: 'ops',
        put: applied.put,
        del: applied.del,
        notes: applied.notes,
        appended: applied.put + applied.del,
        snapshotWritten: false,
        events: written,
        entries: countItems(store),
        historyRows: countEvents(store),
      }
    }
    const items = Array.isArray(payload.items) ? payload.items : []
    const notes = isPlainObject(payload.notes) ? payload.notes : {}
    const applied = applyDocument(store, items, notes)
    const written = insertEvents(store, events)
    return {
      mode: 'document',
      put: applied.put,
      del: applied.del,
      notes: applied.notes,
      appended: applied.put + applied.del,
      snapshotWritten: false,
      events: written,
      entries: countItems(store),
      historyRows: countEvents(store),
    }
  }

  // The JSON backend works on whole documents, so ops are folded in first.
  if (Array.isArray(payload.ops)) {
    for (const op of payload.ops) applyJsonOp(store, op)
  } else if (Array.isArray(payload.items)) {
    store.items = new Map()
    for (const item of payload.items) {
      if (isPlainObject(item) && typeof item.id === 'string') store.items.set(item.id, item)
    }
    if (isPlainObject(payload.notes)) store.notes = payload.notes
  }
  const document = { items: Array.from(store.items.values()), notes: store.notes }
  const result = await jsonWrite(paths, store, document)
  const written = await appendJsonHistory(paths, events)
  return {
    mode: Array.isArray(payload.ops) ? 'ops' : 'document',
    put: 0,
    del: 0,
    notes: 0,
    // With ops the change count is what the caller sent; the diff sees nothing
    // left to do because the ops are already folded into the snapshot.
    appended: Array.isArray(payload.ops) ? payload.ops.length : result.appended,
    snapshotWritten: result.snapshotWritten,
    events: written,
    entries: store.items.size,
    historyRows: result.appended,
  }
}

function countItems(store) {
  if (store.backend === 'sqlite') {
    const row = store.db.prepare('SELECT COUNT(*) AS n FROM items').get()
    return Number(row?.n ?? 0)
  }
  return store.items.size
}

/* ------------------------------------------------------------- moving -- */

/** Carry the data files into the newly chosen directory, never overwriting. */
async function moveData(fromPaths, toPaths) {
  await mkdir(toPaths.directory, { recursive: true })
  const moved = []
  const skipped = []
  for (const file of DATA_FILES) {
    const from = join(fromPaths.directory, file)
    const to = join(toPaths.directory, file)
    if (!(await exists(from))) continue
    if (await exists(to)) {
      skipped.push(file)
      continue
    }
    try {
      await rename(from, to)
    } catch (error) {
      // Another volume: copy the bytes, then drop the source.
      const bytes = await readFile(from)
      await writeFile(to, bytes)
      await rm(from, { force: true })
    }
    moved.push(file)
  }
  return { moved, skipped }
}

/** Prove the directory is writable before it becomes the data home. */
async function probe(target) {
  await mkdir(target, { recursive: true })
  const file = join(target, '.dsh-todo-notes.probe')
  await writeFile(file, 'ok', 'utf8')
  await rm(file, { force: true })
}

/** What the page is told about where its data lives. */
function storageReport(paths, store) {
  return {
    storage: store.backend,
    dbPath: store.backend === 'sqlite' ? paths.dbFile : null,
    path: store.backend === 'sqlite' ? paths.dbFile : paths.snapshotFile,
    historyPath: store.backend === 'sqlite' ? null : paths.historyFile,
    journalLines: store.backend === 'sqlite' ? 0 : store.journalLines,
    storageNote: typeof store.storageNote === 'string' ? store.storageNote : null,
    migrated: store.migrated,
  }
}

/**
 * Register the data routes.
 * @param ctx - Host context carrying the web server.
 */
export function apply(ctx) {
  ctx.effect(() => {
    const dispose = ctx.webServer.register({
      kind: 'exact',
      path: ROUTE + '/state',
      handler: async (req, res) => {
        if (rejected(ctx, req, res)) return
        try {
          const paths = await resolvePaths(ctx)
          const store = await openStore(paths)
          const report = storageReport(paths, store)

          if (req.method === 'GET' || req.method === 'HEAD') {
            const items = store.backend === 'sqlite' ? readItems(store) : Array.from(store.items.values())
            const notes = store.backend === 'sqlite' ? readNotes(store) : store.notes
            sendJson(res, 200, {
              version: SCHEMA_VERSION,
              items,
              notes,
              corrupt: store.backend === 'sqlite' ? false : store.corrupt === true,
              directory: paths.directory,
              defaultDirectory: paths.defaultDirectory,
              opsAccepted: true,
              entries: items.length,
              historyRows: store.backend === 'sqlite' ? countEvents(store) : 0,
              ...report,
            })
            // The import result is a one-off notice; report it once.
            store.migrated = null
            return
          }

          if (req.method === 'POST') {
            const payload = await readJsonBody(req)
            const body = isPlainObject(payload) ? payload : {}
            const saved = await writeStore(paths, store, body)
            sendJson(res, 200, {
              version: SCHEMA_VERSION,
              directory: paths.directory,
              applied: saved.appended,
              put: saved.put,
              del: saved.del,
              mode: saved.mode,
              events: saved.events,
              entries: saved.entries,
              historyRows: saved.historyRows,
              snapshot: saved.snapshotWritten,
              ...report,
            })
            return
          }

          res.statusCode = 405
          res.end()
        } catch (error) {
          sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) })
        }
      },
    })
    return () => {
      dispose()
      closeAllStores()
    }
  }, 'todo-notes: state route')

  ctx.effect(() => {
    const dispose = ctx.webServer.register({
      kind: 'exact',
      path: ROUTE + '/history',
      handler: async (req, res) => {
        if (rejected(ctx, req, res)) return
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          res.statusCode = 405
          res.end()
          return
        }
        try {
          const paths = await resolvePaths(ctx)
          const store = await openStore(paths)
          if (store.backend !== 'sqlite') {
            sendJson(res, 200, { storage: store.backend, events: [], path: paths.historyFile })
            return
          }
          const url = new URL(req.url ?? '/', 'http://localhost')
          const day = url.searchParams.get('day')
          const requested = Number(url.searchParams.get('limit') ?? '100')
          const limit = Number.isFinite(requested) ? Math.min(Math.max(Math.trunc(requested), 1), 1000) : 100
          const rows = day === null
            ? store.db.prepare('SELECT at, day, kind, detail FROM events ORDER BY id DESC LIMIT ?').all(limit)
            : store.db.prepare('SELECT at, day, kind, detail FROM events WHERE day = ? ORDER BY id DESC LIMIT ?').all(day, limit)
          const events = []
          for (const row of rows) {
            let detail = null
            try {
              detail = JSON.parse(row.detail)
            } catch (error) {
              // A row written by an older version may not be JSON.
            }
            events.push(detail ?? { at: row.at, day: row.day, kind: row.kind })
          }
          sendJson(res, 200, { storage: store.backend, day, events, limit })
        } catch (error) {
          sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) })
        }
      },
    })
    return dispose
  }, 'todo-notes: history route')

  ctx.effect(() => {
    const dispose = ctx.webServer.register({
      kind: 'exact',
      path: ROUTE + '/location',
      handler: async (req, res) => {
        if (rejected(ctx, req, res)) return
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        try {
          const payload = await readJsonBody(req)
          const requested = typeof payload.directory === 'string' ? payload.directory.trim() : ''
          const current = await resolvePaths(ctx)
          // Close before touching the files: WAL is checkpointed on the way out.
          closeStore(current.directory)

          if (requested === '') {
            await rm(current.locationFile, { force: true })
            const next = await resolvePaths(ctx)
            const result = next.directory === current.directory
              ? { moved: [], skipped: [] }
              : await moveData(current, next)
            sendJson(res, 200, {
              directory: next.directory,
              defaultDirectory: next.defaultDirectory,
              path: next.dbFile,
              dbPath: next.dbFile,
              historyPath: null,
              moved: result.moved,
              skipped: result.skipped,
              cleared: true,
            })
            return
          }

          if (!isAbsolute(requested)) {
            sendJson(res, 400, { error: 'directory must be an absolute path' })
            return
          }
          const target = normalize(requested)
          if (dirname(target) === target) {
            sendJson(res, 400, { error: 'refusing a filesystem root as the data directory' })
            return
          }
          try {
            await probe(target)
          } catch (error) {
            sendJson(res, 400, {
              error: 'directory is not writable: ' + (error instanceof Error ? error.message : String(error)),
            })
            return
          }

          await mkdir(current.homeDir, { recursive: true })
          const temporary = current.locationFile + '.tmp'
          await writeFile(temporary, JSON.stringify({ directory: target }, null, 2), 'utf8')
          await rename(temporary, current.locationFile)

          const next = await resolvePaths(ctx)
          const result = next.directory === current.directory
            ? { moved: [], skipped: [] }
            : await moveData(current, next)
          sendJson(res, 200, {
            directory: next.directory,
            defaultDirectory: next.defaultDirectory,
            path: next.dbFile,
            dbPath: next.dbFile,
            historyPath: null,
            moved: result.moved,
            skipped: result.skipped,
            cleared: false,
          })
        } catch (error) {
          sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) })
        }
      },
    })
    return dispose
  }, 'todo-notes: location route')
}

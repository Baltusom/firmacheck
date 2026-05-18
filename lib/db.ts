import BetterSqlite3 from 'better-sqlite3'

let _db: BetterSqlite3.Database | null = null

function initSchema(db: BetterSqlite3.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cache_firem (
      ico TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      cached_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ulozene_firmy (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ico TEXT NOT NULL,
      nazev TEXT NOT NULL,
      adresa TEXT NOT NULL,
      ulozeno_at INTEGER NOT NULL
    );
  `)
}

export function getDb(): BetterSqlite3.Database {
  if (!_db) {
    _db = new BetterSqlite3('/tmp/firmacheck.db')
    initSchema(_db)
  }
  return _db
}

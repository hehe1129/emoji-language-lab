PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS sessions (
 id TEXT PRIMARY KEY NOT NULL,
 token_hash TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS works (
 id TEXT PRIMARY KEY NOT NULL,
 level_id TEXT NOT NULL CHECK(level_id IN ('01','02','03','04','05')),
 sequence TEXT NOT NULL CHECK(json_valid(sequence) AND json_type(sequence)='array'),
 session_id TEXT NOT NULL REFERENCES sessions(id),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS works_level_date ON works(level_id,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS works_session_level ON works(session_id,level_id);
CREATE TRIGGER IF NOT EXISTS works_no_update BEFORE UPDATE ON works BEGIN SELECT RAISE(ABORT,'Published works are immutable'); END;
CREATE TRIGGER IF NOT EXISTS works_no_delete BEFORE DELETE ON works BEGIN SELECT RAISE(ABORT,'Published works cannot be deleted'); END;

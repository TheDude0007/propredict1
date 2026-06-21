// Self-contained SQLite database — zero external dependencies
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'propredict.db');
let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      sport TEXT NOT NULL,
      name TEXT NOT NULL,
      abbreviation TEXT NOT NULL,
      city TEXT NOT NULL,
      conference TEXT,
      division TEXT,
      elo_rating INTEGER DEFAULT 1500,
      win_pct REAL DEFAULT 0.5,
      ats_wins INTEGER DEFAULT 0,
      ats_losses INTEGER DEFAULT 0,
      recent_form TEXT DEFAULT '?????',
      primary_color TEXT DEFAULT '#000000'
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      sport TEXT NOT NULL,
      home_team_id TEXT NOT NULL,
      away_team_id TEXT NOT NULL,
      game_time TEXT NOT NULL,
      status TEXT DEFAULT 'SCHEDULED',
      home_score INTEGER,
      away_score INTEGER,
      quarter TEXT,
      venue TEXT
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      sport TEXT NOT NULL,
      pick_type TEXT NOT NULL,
      pick_side TEXT NOT NULL,
      line REAL NOT NULL,
      confidence INTEGER NOT NULL,
      expected_value REAL DEFAULT 0,
      kelly_pct REAL DEFAULT 0,
      sharp_money_pct INTEGER,
      public_pct INTEGER,
      steam_flag INTEGER DEFAULT 0,
      key_factors TEXT DEFAULT '[]',
      risk_factors TEXT DEFAULT '[]',
      model_reasoning TEXT DEFAULT '',
      contrarian_case TEXT DEFAULT '',
      result TEXT,
      clv REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS betting_records (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      sport TEXT NOT NULL,
      bet_type TEXT NOT NULL,
      side TEXT NOT NULL,
      line_at_bet REAL NOT NULL,
      closing_line REAL,
      clv REAL,
      odds INTEGER NOT NULL,
      stake REAL NOT NULL,
      units REAL DEFAULT 1,
      result TEXT DEFAULT 'PENDING',
      profit_loss REAL,
      book TEXT,
      notes TEXT,
      placed_at TEXT DEFAULT (datetime('now')),
      settled_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sharp_alerts (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      alert_type TEXT NOT NULL,
      side TEXT NOT NULL,
      movement_pts REAL NOT NULL,
      from_line REAL NOT NULL,
      to_line REAL NOT NULL,
      public_pct INTEGER,
      reasoning TEXT,
      triggered_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

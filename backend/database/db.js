import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'edulearn.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

export function getDatabase(customPath = DB_PATH) {
  const db = new DatabaseSync(customPath);
  
  // Enable foreign keys & WAL mode for high concurrency
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  // Initialize schema if not initialized
  const schemaSql = readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schemaSql);

  return db;
}

export const db = getDatabase();

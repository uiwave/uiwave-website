import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { SEED_SQL } from './seed-data';

let sqlJsPromise: Promise<SqlJsStatic> | null = null;
let db: Database | null = null;

function loadSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({
      locateFile: () => sqlWasmUrl,
    });
  }
  return sqlJsPromise;
}

export async function getDatabase(): Promise<Database> {
  if (db) return db;
  const SQL = await loadSqlJs();
  db = new SQL.Database();
  db.run(SEED_SQL);
  return db;
}

export async function resetDatabase(): Promise<Database> {
  const SQL = await loadSqlJs();
  db?.close();
  db = new SQL.Database();
  db.run(SEED_SQL);
  return db;
}
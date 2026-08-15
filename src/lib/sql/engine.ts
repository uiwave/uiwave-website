import { createRequire } from 'node:module';
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import { SEED_SQL } from './seed-data';

let sqlJsPromise: Promise<SqlJsStatic> | null = null;

function loadSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    const require = createRequire(import.meta.url);
    sqlJsPromise = initSqlJs({
      locateFile: () => require.resolve('sql.js/dist/sql-wasm.wasm'),
    });
  }
  return sqlJsPromise;
}

export async function createDatabase(): Promise<Database> {
  const SQL = await loadSqlJs();
  const db = new SQL.Database();
  db.run(SEED_SQL);
  return db;
}

export { executeSql, validateSqlInput } from './runner';
export type { SqlExecution } from './runner';
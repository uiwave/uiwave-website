import type { Database } from 'sql.js';
import type { SqlResult } from './evaluator';

const MAX_SQL_LENGTH = 4000;
const MAX_STATEMENTS = 20;

export interface SqlExecution {
  result?: SqlResult;
  error?: string;
}

export function executeSql(db: Database, sql: string): SqlExecution {
  if (!sql.trim()) {
    return { error: 'Escribe una consulta SQL antes de ejecutar.' };
  }
  if (sql.length > MAX_SQL_LENGTH) {
    return {
      error: `La consulta es demasiado larga (máximo ${MAX_SQL_LENGTH} caracteres).`,
    };
  }
  try {
    const results = db.exec(sql);
    if (results.length === 0) {
      return { result: { columns: [], rows: [] } };
    }
    const last = results[results.length - 1];
    return {
      result: {
        columns: last.columns,
        rows: last.values.map((row) => [...row]),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const cleaned = message.replace(/^\(?[A-Za-z]+ error\)?: /, '').trim();
    return { error: cleaned || 'Error de sintaxis en la consulta.' };
  }
}

export function countStatements(sql: string): number {
  return sql.split(';').filter((s) => s.trim().length > 0).length;
}

export function validateSqlInput(sql: string): string | null {
  if (!sql.trim()) return 'Escribe una consulta SQL antes de ejecutar.';
  if (sql.length > MAX_SQL_LENGTH) {
    return `La consulta es demasiado larga (máximo ${MAX_SQL_LENGTH} caracteres).`;
  }
  if (countStatements(sql) > MAX_STATEMENTS) {
    return `Demasiadas sentencias (máximo ${MAX_STATEMENTS} por envío).`;
  }
  return null;
}
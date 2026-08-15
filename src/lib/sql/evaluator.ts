export interface SqlResult {
  columns: string[];
  rows: unknown[][];
}

export interface ExpectedResult {
  columns: string[];
  rows: unknown[][];
}

export function normalizeValue(value: unknown): unknown {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : Number(value.toFixed(6));
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Uint8Array) {
    return null;
  }
  return value;
}

export function normalizeResult(result: SqlResult): SqlResult {
  const columns = result.columns.map((c) => c.toLowerCase()).sort();
  const rows = result.rows
    .map((row) => row.map(normalizeValue).map((v) => JSON.stringify(v)))
    .sort();
  return { columns, rows };
}

export function resultsMatch(
  actual: SqlResult,
  expected: ExpectedResult,
): boolean {
  const a = normalizeResult(actual);
  const e = normalizeResult(expected);
  if (a.columns.length !== e.columns.length) return false;
  if (a.rows.length !== e.rows.length) return false;
  for (let i = 0; i < a.columns.length; i++) {
    if (a.columns[i] !== e.columns[i]) return false;
  }
  for (let i = 0; i < a.rows.length; i++) {
    const actualRow = a.rows[i];
    const expectedRow = e.rows[i];
    if (actualRow.length !== expectedRow.length) return false;
    for (let j = 0; j < actualRow.length; j++) {
      if (actualRow[j] !== expectedRow[j]) return false;
    }
  }
  return true;
}
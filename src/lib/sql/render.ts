import type { SqlResult } from './evaluator';

export function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '<span class="italic text-muted-foreground">NULL</span>';
  }
  if (typeof value === 'number') {
    return `<span class="tabular-nums">${escapeHtml(value)}</span>`;
  }
  return `<span>${escapeHtml(value)}</span>`;
}

export function renderResultTable(
  element: HTMLElement,
  result: SqlResult,
): void {
  const { columns, rows } = result;
  if (columns.length === 0) {
    element.innerHTML = `
      <div class="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        Consulta ejecutada correctamente (${rows.length} fila${rows.length === 1 ? '' : 's'} afectada${rows.length === 1 ? '' : 's'}).
      </div>`;
    return;
  }

  const header = columns
    .map(
      (col) =>
        `<th scope="col" class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">${escapeHtml(col)}</th>`,
    )
    .join('');
  const body = rows
    .map(
      (row) =>
        `<tr class="border-t border-border/60 hover:bg-muted/40">${row
          .map((cell) => `<td class="px-3 py-2 text-sm">${formatCell(cell)}</td>`)
          .join('')}</tr>`,
    )
    .join('');

  element.innerHTML = `
    <div class="overflow-x-auto rounded-lg border border-border">
      <table class="w-full border-collapse bg-card text-left">
        <thead class="bg-muted/60">
          <tr>${header}</tr>
        </thead>
        <tbody>${
          body ||
          `<tr><td class="px-3 py-4 text-center text-sm text-muted-foreground" colspan="${columns.length}">Sin resultados</td></tr>`
        }</tbody>
      </table>
    </div>`;
}
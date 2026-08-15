import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { sql, SQLite } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { getDatabase, resetDatabase } from './client';
import { executeSql, validateSqlInput } from './runner';
import type { SqlExecution } from './runner';
import { escapeHtml, renderResultTable } from './render';

declare global {
  interface Window {
    __sqlPlaygrounds: Map<string, SqlPlayground>;
  }
}

if (!window.__sqlPlaygrounds) {
  window.__sqlPlaygrounds = new Map();
}

const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
    height: '100%',
  },
  '.cm-scroller': {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.875rem',
    lineHeight: '1.6',
  },
  '.cm-content': {
    caretColor: 'var(--primary)',
    padding: '0.75rem 0',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--muted-foreground)',
    borderRight: 'none',
    paddingLeft: '0.5rem',
  },
  '.cm-activeLine': {
    backgroundColor: 'color-mix(in oklab, var(--primary) 6%, transparent)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'color-mix(in oklab, var(--primary) 6%, transparent)',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'color-mix(in oklab, var(--primary) 20%, transparent)',
  },
  '.cm-placeholder': { color: 'var(--muted-foreground)' },
  '.cm-tooltip': {
    backgroundColor: 'var(--popover)',
    color: 'var(--popover-foreground)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
  },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-foreground)',
  },
});

const darkThemeOverrides = EditorView.theme({
  '&': { backgroundColor: 'transparent' },
  '.cm-gutters': { backgroundColor: 'transparent' },
  '.cm-activeLine': {
    backgroundColor: 'color-mix(in oklab, var(--primary) 10%, transparent)',
  },
  '.cm-tooltip': {
    backgroundColor: 'var(--popover)',
    border: '1px solid var(--border)',
  },
});

export interface PlaygroundOptions {
  id?: string;
  editorElement: HTMLElement;
  initialSql: string;
  placeholder?: string;
  runButton?: HTMLElement | null;
  resetButton?: HTMLElement | null;
  resultElement: HTMLElement;
  statusElement?: HTMLElement | null;
  resetLabel?: string;
  onRun?: (sql: string, execution: SqlExecution) => void;
  onReset?: () => void;
}

export interface SqlPlayground {
  getValue(): string;
  setValue(sql: string): void;
  run(): Promise<void>;
  reset(): Promise<void>;
  setRunning(running: boolean): void;
  destroy(): void;
}

function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark');
}

export function createPlayground(options: PlaygroundOptions): SqlPlayground {
  const {
    editorElement,
    initialSql,
    runButton,
    resetButton,
    resultElement,
    statusElement,
    onRun,
    onReset,
    resetLabel,
  } = options;

  const themeCompartment = new Compartment();
  let running = false;

  const run = async (): Promise<void> => {
    if (running) return;
    const sql = view.state.doc.toString();
    const validationError = validateSqlInput(sql);
    if (validationError) {
      renderResult({ error: validationError }, null);
      return;
    }
    running = true;
    runButton?.setAttribute('disabled', '');
    const start = performance.now();
    try {
      const db = await getDatabase();
      const execution = executeSql(db, sql);
      const elapsed = Math.round(performance.now() - start);
      renderResult(execution, elapsed);
      onRun?.(sql, execution);
    } finally {
      running = false;
      runButton?.removeAttribute('disabled');
    }
  };

  const reset = async (): Promise<void> => {
    resetButton?.setAttribute('disabled', '');
    try {
      await resetDatabase();
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: initialSql },
      });
      renderResult(null, null);
      if (resetLabel) {
        statusElement && (statusElement.textContent = resetLabel);
      } else {
        statusElement && (statusElement.textContent = 'Base de datos reiniciada');
      }
      onReset?.();
    } finally {
      resetButton?.removeAttribute('disabled');
    }
  };

  const renderResult = (execution: SqlExecution | null, elapsed: number | null): void => {
    if (!execution) {
      resultElement.innerHTML = '';
      if (statusElement) statusElement.textContent = '';
      return;
    }

    if (execution.error) {
      resultElement.innerHTML = `
        <div class="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
          <div>
            <p class="font-medium text-destructive">Error SQL</p>
            <p class="mt-1 text-sm text-muted-foreground">${escapeHtml(execution.error)}</p>
          </div>
        </div>`;
      if (statusElement) statusElement.textContent = '';
      return;
    }

    const { columns, rows } = execution.result!;
    if (columns.length === 0) {
      resultElement.innerHTML = `
        <div class="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          Consulta ejecutada correctamente (${rows.length} fila${rows.length === 1 ? '' : 's'} afectada${rows.length === 1 ? '' : 's'}).
        </div>`;
      if (statusElement && elapsed !== null) {
        statusElement.textContent = `${rows.length} filas afectadas · ${elapsed} ms`;
      }
      return;
    }

    renderResultTable(resultElement, execution.result);
    if (statusElement && elapsed !== null) {
      statusElement.textContent = `${rows.length} filas · ${elapsed} ms`;
    }
  };

  const themeExtension = themeCompartment.of(
    isDarkMode() ? [oneDark, darkThemeOverrides] : [lightTheme],
  );

  const view = new EditorView({
    parent: editorElement,
    state: EditorState.create({
      doc: initialSql,
      extensions: [
        history(),
        sql({ dialect: SQLite }),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          {
            key: 'Mod-Enter',
            run: () => {
              void run();
              return true;
            },
          },
        ]),
        themeExtension,
        cmPlaceholder(options.placeholder ?? 'Escribe tu consulta SQL aquí…'),
        EditorView.lineWrapping,
      ],
    }),
  });

  const themeObserver = new MutationObserver(() => {
    const isDark = isDarkMode();
    view.dispatch({
      effects: themeCompartment.reconfigure(
        isDark ? [oneDark, darkThemeOverrides] : [lightTheme],
      ),
    });
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  runButton?.addEventListener('click', () => void run());
  resetButton?.addEventListener('click', () => void reset());

  const api: SqlPlayground = {
    getValue: () => view.state.doc.toString(),
    setValue: (sql: string) => {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: sql },
      });
    },
    run,
    reset,
    setRunning: (value: boolean) => {
      running = value;
      if (value) {
        runButton?.setAttribute('disabled', '');
      } else {
        runButton?.removeAttribute('disabled');
      }
    },
    destroy: () => {
      themeObserver.disconnect();
      view.destroy();
    },
  };

  if (options.id) {
    window.__sqlPlaygrounds.set(options.id, api);
  }

  return api;
}
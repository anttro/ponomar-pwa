/**
 * Forensic event log — append-only ring buffer in localStorage.
 *
 * Deliberately stored OUTSIDE IndexedDB / CacheStorage so it survives
 * DataCache.clear(), service-worker cache purges and version wipes.
 * Used to diagnose transient offline/precache issues after the fact.
 */

const DIAG_KEY = 'ponomar-diag-log';
const MAX_EVENTS = 30;

export interface DiagEvent {
  t: string;
  event: string;
  [key: string]: unknown;
}

export function diagLog(event: string, detail?: Record<string, unknown>) {
  try {
    const raw = localStorage.getItem(DIAG_KEY);
    const arr: DiagEvent[] = raw ? JSON.parse(raw) : [];
    arr.push({ t: new Date().toISOString(), event, ...(detail ?? {}) });
    while (arr.length > MAX_EVENTS) arr.shift();
    localStorage.setItem(DIAG_KEY, JSON.stringify(arr));
  } catch { /* best-effort */ }
}

export function getDiagLog(): DiagEvent[] {
  try {
    const raw = localStorage.getItem(DIAG_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function formatEvent(e: DiagEvent): string {
  const time = (e.t || '').slice(11, 19);
  const parts: string[] = [];
  for (const [k, v] of Object.entries(e)) {
    if (k === 't' || k === 'event') continue;
    parts.push(`${k}=${String(v)}`);
  }
  return `${time} ${e.event}${parts.length ? ' ' + parts.join(' ') : ''}`;
}

export function diagTail(): string {
  return getDiagLog().map(formatEvent).join('\n');
}

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

function readEvents(): DiagEvent[] {
  const raw = localStorage.getItem(DIAG_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr as DiagEvent[];
  } catch { /* fall through */ }
  // Corrupted or non-array value — reset so logging can recover
  localStorage.removeItem(DIAG_KEY);
  return [];
}

export function diagLog(event: string, detail?: Record<string, unknown>) {
  try {
    const arr = readEvents();
    arr.push({ t: new Date().toISOString(), event, ...(detail ?? {}) });
    while (arr.length > MAX_EVENTS) arr.shift();
    localStorage.setItem(DIAG_KEY, JSON.stringify(arr));
  } catch { /* best-effort */ }
}

export function getDiagLog(): DiagEvent[] {
  try {
    return readEvents();
  } catch {
    return [];
  }
}

function formatEvent(e: DiagEvent): string {
  // MM-DD HH:MM:SS (local relevance comes from ISO UTC; day boundary matters
  // when events span days)
  const time = `${(e.t || '').slice(5, 10)} ${(e.t || '').slice(11, 19)}`;
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

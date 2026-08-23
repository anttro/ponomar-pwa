/**
 * PWA installation state detection.
 *
 * 'ponomar-ever-installed' is a permanent marker (never removed): set when
 * the app is installed, launched in standalone mode, or inherited from the
 * legacy 'ponomar-installed' offer flag. Used to hide the Settings install
 * button on browsers without getInstalledRelatedApps() (Firefox, Safari).
 * Distinct from 'ponomar-installed', which only gates the first-launch
 * offline-offer modal and is cleared on appinstalled for re-offer semantics.
 */

const EVER_INSTALLED_KEY = 'ponomar-ever-installed';

export function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export function markEverInstalled(): void {
  try {
    localStorage.setItem(EVER_INSTALLED_KEY, '1');
  } catch { /* best-effort */ }
}

export function hasEverInstalledMarker(): boolean {
  try {
    return localStorage.getItem(EVER_INSTALLED_KEY) === '1';
  } catch {
    return false;
  }
}

export async function isPwaInstalled(): Promise<boolean> {
  if (isStandaloneDisplay()) return true;
  if (hasEverInstalledMarker()) return true;
  try {
    const navAny = navigator as any;
    if (typeof navAny.getInstalledRelatedApps === 'function') {
      const apps = await navAny.getInstalledRelatedApps();
      if (Array.isArray(apps) && apps.length > 0) return true;
    }
  } catch { /* not supported */ }
  return false;
}

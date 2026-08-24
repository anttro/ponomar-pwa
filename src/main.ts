import './styles/main.css';
import { registerSW } from 'virtual:pwa-register';
import { App } from './ui/app';
import { getTranslations, type LanguageCode } from './core/i18n';
import { loadSettings } from './ui/settings-view';

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh: () => showUpdateToast(),
});

function showUpdateToast() {
  if (document.getElementById('pwa-update-toast')) return;
  const t = getTranslations(loadSettings().language as LanguageCode);
  const toast = document.createElement('div');
  toast.id = 'pwa-update-toast';
  toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] bg-surface border border-gold/40 rounded-lg shadow-xl px-4 py-3 flex items-center gap-3 max-w-[calc(100vw-2rem)]';
  toast.innerHTML = `
    <span class="text-base text-navy whitespace-nowrap">${t.updateAvailable}</span>
    <button id="pwa-update-btn" class="bg-gold text-navy rounded px-3 py-1 text-base font-bold hover:bg-gold-dark transition-colors whitespace-nowrap">${t.updateReload}</button>
    <button id="pwa-update-dismiss" class="text-navy-light hover:text-navy text-lg leading-none px-1" aria-label="✕">&times;</button>
  `;
  document.body.appendChild(toast);
  toast.querySelector('#pwa-update-btn')?.addEventListener('click', () => {
    (toast.querySelector('#pwa-update-btn') as HTMLButtonElement).disabled = true;
    updateSW(true);
  });
  toast.querySelector('#pwa-update-dismiss')?.addEventListener('click', () => toast.remove());
}

const app = new App(document.getElementById('app')!);
app.init();

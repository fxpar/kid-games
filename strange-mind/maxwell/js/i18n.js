// Langue du jeu (français par défaut, anglais disponible) — module commun à toutes les versions.
//
// Choix de la langue : ?lang=en ou ?lang=fr dans l'adresse, sinon le dernier choix (mémorisé pour
// toutes les versions), sinon la langue du navigateur.
//
// Utilisation :
//   import { t, LANG, setDictionary, translateDom, langToggle, speechLang } from './i18n.js';
//   setDictionary(EN);                 // dictionnaire anglais { 'phrase française': 'English sentence' }
//   t('Bravo !')                       // → 'Well done!' en anglais, 'Bravo !' en français
//   t('Série de {n} !', { n: 5 })      // variables entre accolades
//   <h2 data-t="help-title">…</h2>     // HTML : clé explicite (data-t="clé") ou, sans valeur, le texte français
//   <button data-t-title="Son">        // attribut title traduit
//   translateDom()                     // à appeler une fois au démarrage
//   langToggle(bouton)                 // bouton EN / FR qui change de langue

const KEY = 'strange-mind:lang';

function detect() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'fr') { try { localStorage.setItem(KEY, q); } catch { /* */ } return q; }
  } catch { /* */ }
  try { const s = localStorage.getItem(KEY); if (s === 'en' || s === 'fr') return s; } catch { /* */ }
  return (navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export const LANG = detect();
document.documentElement.lang = LANG;

let DICT = {};
export function setDictionary(en) { DICT = en || {}; }

const norm = (s) => String(s).trim().replace(/\s+/g, ' ');

/** Traduit une phrase française (clé) ; remplace {variables}. */
export function t(fr, vars) {
  let s = fr;
  if (LANG === 'en') {
    const hit = DICT[fr] ?? DICT[norm(fr)];
    if (hit != null) s = hit;
  }
  if (vars) s = String(s).replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}

/** Traduit les éléments marqués data-t / data-t-title (y compris dans les <template>). */
export function translateDom(root = document) {
  if (LANG !== 'en') return;
  const roots = [root, ...[...root.querySelectorAll('template')].map((tp) => tp.content)];
  for (const r of roots) {
    r.querySelectorAll('[data-t]').forEach((el) => {
      const k = el.getAttribute('data-t') || norm(el.innerHTML);
      const v = DICT[k];
      if (v != null) el.innerHTML = v;
    });
    r.querySelectorAll('[data-t-title]').forEach((el) => {
      const k = el.getAttribute('data-t-title') || el.getAttribute('title');
      const v = DICT[k];
      if (v != null) el.setAttribute('title', v);
    });
  }
  const tt = DICT[norm(document.title)];
  if (tt) document.title = tt;
}

export function setLang(l) {
  try { localStorage.setItem(KEY, l); } catch { /* */ }
  const u = new URL(location.href);
  u.searchParams.delete('lang');
  location.href = u.toString();
}

/** Transforme un bouton en sélecteur de langue. */
export function langToggle(btn) {
  if (!btn) return;
  btn.textContent = LANG === 'en' ? 'FR' : 'EN';
  btn.style.fontWeight = '800'; btn.style.fontSize = '16px';
  btn.title = LANG === 'en' ? 'Version française' : 'English version';
  btn.addEventListener('click', () => setLang(LANG === 'en' ? 'fr' : 'en'));
}

/** Langue pour la synthèse vocale : 'en-GB' ou 'fr-FR' (et préfixe pour choisir la voix). */
export const speechLang = () => (LANG === 'en' ? 'en-GB' : 'fr-FR');
export const voicePrefix = () => (LANG === 'en' ? 'en' : 'fr');

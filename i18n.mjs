import { LANGUAGES, resolveLanguage, translate } from './i18n-core.mjs';

const preferenceKey = 'shuyu-portfolio-language';
const browserLanguages = () => navigator.languages?.length ? navigator.languages : [navigator.language || 'en'];
let preference = 'auto';
try { preference = localStorage.getItem(preferenceKey) || 'auto'; } catch { /* Device storage is optional. */ }
if (!LANGUAGES.includes(preference)) preference = 'auto';
let language = resolveLanguage(preference, browserLanguages());
export const getLocale = () => language;
const textSources = new WeakMap();
const attributeSources = new WeakMap();
const attributes = ['aria-label', 'alt', 'title', 'placeholder', 'data-mobile-hint'];
const excluded = 'script, style, [data-no-translate], [contenteditable="true"]';
let observer;
let initialized = false;

function updateText(node) {
  if (!node.parentElement || node.parentElement.closest(excluded)) return;
  const previous = textSources.get(node);
  const source = previous && node.data === previous.output ? previous.source : node.data;
  const output = translate(source, language);
  textSources.set(node, { source, output });
  if (node.data !== output) node.data = output;
}
function updateAttributes(element) {
  if (element.closest(excluded)) return;
  const names = element.matches('meta[name="description"]') ? [...attributes, 'content'] : attributes;
  const previous = attributeSources.get(element) || new Map();
  for (const name of names) {
    if (!element.hasAttribute(name)) continue;
    const current = element.getAttribute(name);
    const record = previous.get(name);
    const source = record && current === record.output ? record.source : current;
    const output = translate(source, language);
    previous.set(name, { source, output });
    if (current !== output) element.setAttribute(name, output);
  }
  attributeSources.set(element, previous);
}
function translateTree(root) {
  if (root.nodeType === 3) { updateText(root); return; }
  if (root.nodeType !== 1 || root.closest(excluded)) return;
  updateAttributes(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeType === 3) updateText(node);
    else updateAttributes(node);
  }
}
function observe() {
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...attributes, 'content'] });
}
function applyLanguage(nextPreference, remember = true) {
  preference = LANGUAGES.includes(nextPreference) ? nextPreference : 'auto';
  language = resolveLanguage(preference, browserLanguages());
  if (remember) {
    try { localStorage.setItem(preferenceKey, preference); } catch { /* Continue without storage. */ }
  }
  observer.disconnect();
  document.documentElement.lang = language;
  translateTree(document.documentElement);
  document.querySelectorAll('.language-select').forEach(select => { select.value = preference; });
  observe();
  // Reformat active calculator results without replacing forms or changing inputs.
  window.dispatchEvent(new CustomEvent('portfolio-language-change', { detail: { language } }));
}
export function initI18n() {
  if (initialized) return;
  initialized = true;
  observer = new MutationObserver(records => {
    observer.disconnect();
    const roots = new Set();
    for (const record of records) {
      if (record.type === 'childList') record.addedNodes.forEach(node => roots.add(node));
      else roots.add(record.target);
    }
    roots.forEach(root => { if (root.isConnected) translateTree(root); });
    observe();
  });
  document.querySelectorAll('.language-select').forEach(select => {
    select.addEventListener('change', () => applyLanguage(select.value));
  });
  window.addEventListener('languagechange', () => { if (preference === 'auto') applyLanguage('auto', false); });
  applyLanguage(preference, false);
}

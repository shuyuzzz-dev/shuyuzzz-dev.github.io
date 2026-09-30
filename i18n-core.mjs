import { DICTIONARY } from './i18n-dictionary.mjs';
import { DYNAMIC } from './i18n-dynamic.mjs';

export const LANGUAGES = ['en', 'zh-Hans', 'es'];
export function resolveLanguage(preference, browserLanguages = []) {
  if (LANGUAGES.includes(preference)) return preference;
  for (const tag of browserLanguages) {
    const base = String(tag).toLowerCase().split(/[-_]/)[0];
    if (base === 'zh') return 'zh-Hans';
    if (base === 'es') return 'es';
    if (base === 'en') return 'en';
  }
  return 'en';
}
const normalized = text => text.replace(/\s+/g, ' ').trim();
const lowerCaseKeys = new Map(Object.keys(DICTIONARY).map(key => [key.toLowerCase(), key]));
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = DYNAMIC.map(([source, zh, es]) => {
  const indices = [];
  const expression = source.split(/(\{\d+\})/).map(part => {
    if (/^\{\d+\}$/.test(part)) { indices.push(Number(part.slice(1, -1))); return '(.+?)'; }
    return escape(part);
  }).join('');
  return { regex: new RegExp(`^${expression}$`), indices, translations: [zh, es] };
});
export function translate(text, language = 'en', depth = 0) {
  if (language === 'en' || !LANGUAGES.includes(language)) return text;
  const source = normalized(text);
  const column = language === 'zh-Hans' ? 0 : 1;
  const key = Object.hasOwn(DICTIONARY, source) ? source : lowerCaseKeys.get(source.toLowerCase());
  let translated = key ? DICTIONARY[key][column] : null;
  if (translated === null && depth < 3) {
    for (const pattern of patterns) {
      const match = source.match(pattern.regex);
      if (!match) continue;
      const values = {};
      pattern.indices.forEach((index, i) => { values[index] = match[i + 1]; });
      translated = pattern.translations[column].replace(/\{(\d+)\}/g, (_, i) => translate(values[i], language, depth + 1));
      break;
    }
  }
  if (translated === null) return text;
  return (text.match(/^\s*/)?.[0] || '') + translated + (text.match(/\s*$/)?.[0] || '');
}

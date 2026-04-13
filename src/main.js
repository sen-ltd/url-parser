/**
 * main.js — DOM, events, and UI logic for URL Parser.
 */

import {
  parseURL,
  buildURL,
  parseQuery,
  buildQuery,
  addParam,
  removeParam,
  updateParam,
  encodeComponent,
  decodeComponent,
  isValidURL,
  normalizeURL,
} from './url.js';
import { getT, setLang, getLang } from './i18n.js';

// ── State ─────────────────────────────────────────────────────────────────────

let state = {
  parsed: null,
  queryParams: [],
};

// ── DOM refs ──────────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  renderUI();
  bindEvents();
  loadExample($('examples-select')?.value || '');
});

// ── Render ────────────────────────────────────────────────────────────────────

function renderUI() {
  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = getT(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = getT(el.getAttribute('data-i18n-placeholder'));
  });
  renderQueryTable();
  renderValidation();
  renderComponents();
  renderEncodeDecode();
  renderRebuildURL();
}

function renderComponents() {
  const fields = ['protocol', 'username', 'password', 'hostname', 'port', 'pathname', 'hash'];
  fields.forEach(field => {
    const el = $(`field-${field}`);
    if (!el) return;
    el.value = state.parsed ? (state.parsed[field] || '') : '';
  });
  // Search is derived from queryParams, not directly editable
  const searchEl = $('field-search');
  if (searchEl) {
    searchEl.value = state.parsed ? buildQuery(state.queryParams) : '';
  }
}

function renderQueryTable() {
  const tbody = $('query-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (state.queryParams.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="3" class="no-params">${getT('noParams')}</td>`;
    tbody.appendChild(tr);
    return;
  }

  state.queryParams.forEach(([k, v], idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="param-key" data-idx="${idx}" value="${escHtml(k)}" aria-label="${getT('key')} ${idx + 1}"></td>
      <td>
        <div class="param-value-wrap">
          <input class="param-val" data-idx="${idx}" value="${escHtml(v)}" aria-label="${getT('value')} ${idx + 1}">
          <span class="param-raw" title="${getT('rawLabel')}">${escHtml(encodeComponent(v))}</span>
        </div>
      </td>
      <td><button class="btn-icon btn-delete" data-idx="${idx}" title="${getT('deleteParam')}">✕</button></td>
    `;
    tbody.appendChild(tr);
  });

  // Bind inline edits
  tbody.querySelectorAll('.param-key').forEach(el => {
    el.addEventListener('input', () => {
      const idx = +el.dataset.idx;
      const val = tbody.querySelector(`.param-val[data-idx="${idx}"]`).value;
      state.queryParams = updateParam(state.queryParams, idx, el.value, val);
      debouncedRebuild();
    });
  });
  tbody.querySelectorAll('.param-val').forEach(el => {
    el.addEventListener('input', () => {
      const idx = +el.dataset.idx;
      const key = tbody.querySelector(`.param-key[data-idx="${idx}"]`).value;
      state.queryParams = updateParam(state.queryParams, idx, key, el.value);
      const rawSpan = tbody.querySelector(`.param-raw`);
      // Update raw span inline
      const raw = tbody.querySelector(`tr:nth-child(${idx + 1}) .param-raw`);
      if (raw) raw.textContent = encodeComponent(el.value);
      debouncedRebuild();
    });
  });
  tbody.querySelectorAll('.btn-delete').forEach(el => {
    el.addEventListener('click', () => {
      state.queryParams = removeParam(state.queryParams, +el.dataset.idx);
      renderQueryTable();
      debouncedRebuild();
    });
  });
}

function renderValidation() {
  const panel = $('validation-panel');
  if (!panel) return;
  const url = $('url-input')?.value.trim() || '';
  if (!url) {
    panel.innerHTML = '';
    return;
  }
  const valid = isValidURL(url);
  const normalized = normalizeURL(url);
  const shortForm = makeShortForm(url);

  panel.innerHTML = `
    <div class="valid-badge ${valid ? 'valid' : 'invalid'}">
      ${valid ? '✔ ' + getT('validLabel') : '✘ ' + getT('invalidLabel')}
    </div>
    ${normalized ? `
      <div class="info-row">
        <span class="info-label">${getT('normalizedLabel')}</span>
        <code class="info-value">${escHtml(normalized)}</code>
      </div>` : ''}
    ${shortForm ? `
      <div class="info-row">
        <span class="info-label">${getT('shortFormLabel')}</span>
        <code class="info-value short-form">${escHtml(shortForm)}</code>
      </div>` : ''}
  `;
}

function renderEncodeDecode() {
  const input = $('encode-input')?.value || '';
  const encodedEl = $('encoded-output');
  const decodedEl = $('decoded-output');
  if (encodedEl) encodedEl.value = encodeComponent(input);
  if (decodedEl) decodedEl.value = decodeComponent(input);
}

function renderRebuildURL() {
  if (!state.parsed) {
    const el = $('rebuilt-url');
    if (el) el.value = '';
    return;
  }
  const rebuilt = buildURL({
    protocol: $('field-protocol')?.value || state.parsed.protocol,
    username: $('field-username')?.value || '',
    password: $('field-password')?.value || '',
    hostname: $('field-hostname')?.value || state.parsed.hostname,
    port: $('field-port')?.value || '',
    pathname: $('field-pathname')?.value || '/',
    queryParams: state.queryParams,
    hash: $('field-hash')?.value || '',
  });
  const el = $('rebuilt-url');
  if (el) el.value = rebuilt;
}

// ── Events ────────────────────────────────────────────────────────────────────

function bindEvents() {
  // Parse button
  $('parse-btn')?.addEventListener('click', () => {
    parseAndRender($('url-input')?.value || '');
  });

  // Enter key in URL input
  $('url-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') parseAndRender(e.target.value);
  });

  // Live parse on input with debounce
  $('url-input')?.addEventListener('input', e => {
    debouncedParse(e.target.value);
  });

  // Clear
  $('clear-btn')?.addEventListener('click', () => {
    $('url-input').value = '';
    state.parsed = null;
    state.queryParams = [];
    renderUI();
  });

  // Copy rebuilt URL
  $('copy-rebuilt-btn')?.addEventListener('click', () => {
    const val = $('rebuilt-url')?.value;
    if (val) copyToClipboard(val, $('copy-rebuilt-btn'));
  });

  // Add param
  $('add-param-btn')?.addEventListener('click', () => {
    state.queryParams = addParam(state.queryParams, '', '');
    renderQueryTable();
    renderRebuildURL();
    // Focus the last key input
    const inputs = document.querySelectorAll('.param-key');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  // Component field edits → rebuild
  ['protocol', 'username', 'password', 'hostname', 'port', 'pathname', 'hash'].forEach(f => {
    $(`field-${f}`)?.addEventListener('input', () => {
      debouncedRebuild();
    });
  });

  // Encode/decode panel
  $('encode-input')?.addEventListener('input', renderEncodeDecode);
  $('encode-btn')?.addEventListener('click', () => {
    const input = $('encode-input');
    if (input) { input.value = encodeComponent(input.value); renderEncodeDecode(); }
  });
  $('decode-btn')?.addEventListener('click', () => {
    const input = $('encode-input');
    if (input) { input.value = decodeComponent(input.value); renderEncodeDecode(); }
  });
  $('copy-encoded-btn')?.addEventListener('click', () => {
    copyToClipboard($('encoded-output')?.value || '', $('copy-encoded-btn'));
  });
  $('copy-decoded-btn')?.addEventListener('click', () => {
    copyToClipboard($('decoded-output')?.value || '', $('copy-decoded-btn'));
  });

  // Examples
  $('examples-select')?.addEventListener('change', e => {
    loadExample(e.target.value);
  });

  // Theme toggle
  $('theme-toggle')?.addEventListener('click', () => {
    const dark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  });

  // Language toggle
  $('lang-toggle')?.addEventListener('click', () => {
    const next = getLang() === 'ja' ? 'en' : 'ja';
    setLang(next);
    renderUI();
  });
}

// ── Parse flow ────────────────────────────────────────────────────────────────

function parseAndRender(str) {
  if (!str.trim()) {
    state.parsed = null;
    state.queryParams = [];
  } else {
    state.parsed = parseURL(str);
    state.queryParams = state.parsed ? [...state.parsed.queryParams] : [];
  }
  renderUI();
}

// ── Debounce ──────────────────────────────────────────────────────────────────

let parseTimer = null;
function debouncedParse(val) {
  clearTimeout(parseTimer);
  parseTimer = setTimeout(() => parseAndRender(val), 250);
}

let rebuildTimer = null;
function debouncedRebuild() {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => renderRebuildURL(), 100);
}

// ── Examples ──────────────────────────────────────────────────────────────────

const EXAMPLES = [
  'https://example.com',
  'https://user:pass@api.example.com:8080/v1/items?page=1&limit=20&q=hello+world#results',
  'https://example.com/search?q=%E6%97%A5%E6%9C%AC%E8%AA%9E&lang=ja',
  'https://maps.example.com/?lat=35.6762&lng=139.6503&zoom=12',
  'http://[::1]:3000/api/health',
  'https://cdn.example.com/assets/image.png?v=1.2.3&bust=true',
  'ftp://files.example.com/pub/data.tar.gz',
  'https://example.com/path/to/page',
];

function loadExample(val) {
  if (!val) return;
  const urlInput = $('url-input');
  if (urlInput) {
    urlInput.value = val;
    parseAndRender(val);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeShortForm(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const shortHost = host.length > 15 ? host.slice(0, 12) + '...' : host;
    // Simple concept: use first 2 chars of host + random-looking code
    const code = btoa(host).slice(0, 6).replace(/[+/=]/g, 'x');
    return `https://s.lt/${code}`;
  } catch {
    return null;
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = getT('copiedMsg');
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = orig;
      btn.disabled = false;
    }, 1500);
  });
}

function applyTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
}

// Export for testing convenience
export { parseAndRender };

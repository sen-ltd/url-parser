/**
 * i18n.js — Japanese / English translations.
 */

const translations = {
  ja: {
    title: 'URL パーサ',
    subtitle: 'URL を分解・編集・再構築するツール',
    inputLabel: 'URL を入力',
    inputPlaceholder: 'https://example.com/path?key=value#section',
    parseBtn: '解析',
    clearBtn: 'クリア',
    copyBtn: 'コピー',
    copiedMsg: 'コピー済',
    rebuildBtn: '再構築',
    protocol: 'プロトコル',
    username: 'ユーザー名',
    password: 'パスワード',
    hostname: 'ホスト名',
    port: 'ポート',
    pathname: 'パス',
    search: 'クエリ文字列',
    hash: 'フラグメント',
    queryEditor: 'クエリ文字列エディタ',
    addParam: 'パラメータを追加',
    key: 'キー',
    value: '値',
    actions: '操作',
    deleteParam: '削除',
    encodeDecodeTitle: 'エンコード / デコード',
    encodeInput: 'テキスト',
    encoded: 'エンコード済み',
    decoded: 'デコード済み',
    encodeBtn: 'エンコード',
    decodeBtn: 'デコード',
    validationTitle: 'バリデーション',
    validLabel: '有効な URL',
    invalidLabel: '無効な URL',
    normalizedLabel: '正規化済み URL',
    shortFormLabel: '短縮形（イメージ）',
    examplesTitle: 'URL サンプル',
    rawLabel: '生 (percent-encoded)',
    decodedLabel: 'デコード済み',
    themeToggle: 'テーマ切替',
    langToggle: 'EN',
    noParams: 'クエリパラメータなし',
    invalidURLMsg: '有効な URL を入力してください',
    errorParse: 'URL の解析に失敗しました',
    componentTitle: 'URL コンポーネント',
    rebuildTitle: '再構築済み URL',
    builtUrl: '再構築済み',
  },
  en: {
    title: 'URL Parser',
    subtitle: 'Parse, edit, and reconstruct URLs',
    inputLabel: 'Enter URL',
    inputPlaceholder: 'https://example.com/path?key=value#section',
    parseBtn: 'Parse',
    clearBtn: 'Clear',
    copyBtn: 'Copy',
    copiedMsg: 'Copied!',
    rebuildBtn: 'Rebuild',
    protocol: 'Protocol',
    username: 'Username',
    password: 'Password',
    hostname: 'Hostname',
    port: 'Port',
    pathname: 'Path',
    search: 'Query String',
    hash: 'Fragment',
    queryEditor: 'Query String Editor',
    addParam: 'Add Parameter',
    key: 'Key',
    value: 'Value',
    actions: 'Actions',
    deleteParam: 'Delete',
    encodeDecodeTitle: 'Encode / Decode',
    encodeInput: 'Text',
    encoded: 'Encoded',
    decoded: 'Decoded',
    encodeBtn: 'Encode',
    decodeBtn: 'Decode',
    validationTitle: 'Validation',
    validLabel: 'Valid URL',
    invalidLabel: 'Invalid URL',
    normalizedLabel: 'Normalized URL',
    shortFormLabel: 'Short Form (concept)',
    examplesTitle: 'URL Examples',
    rawLabel: 'Raw (percent-encoded)',
    decodedLabel: 'Decoded',
    themeToggle: 'Toggle theme',
    langToggle: '日本語',
    noParams: 'No query parameters',
    invalidURLMsg: 'Please enter a valid URL',
    errorParse: 'Failed to parse URL',
    componentTitle: 'URL Components',
    rebuildTitle: 'Rebuilt URL',
    builtUrl: 'Rebuilt',
  },
};

let currentLang = 'en';

export function setLang(lang) {
  if (translations[lang]) currentLang = lang;
}

export function getLang() {
  return currentLang;
}

export function getT(key) {
  return (translations[currentLang] && translations[currentLang][key]) ||
    (translations.en[key]) ||
    key;
}

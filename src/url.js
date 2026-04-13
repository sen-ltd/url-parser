/**
 * url.js — URL parsing and building utilities.
 * Wraps the native URL API with careful edge-case handling.
 */

// ── parseURL ──────────────────────────────────────────────────────────────────

/**
 * Parse a URL string into its components.
 * @param {string} str
 * @returns {{ protocol, username, password, host, hostname, port, pathname, search, hash, queryParams: [string,string][] } | null}
 */
export function parseURL(str) {
  if (!str || typeof str !== 'string') return null;
  let input = str.trim();
  // If no protocol is present, try prepending https://
  if (!/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(input) && !input.startsWith('//')) {
    input = 'https://' + input;
  }
  try {
    const u = new URL(input);
    return {
      protocol: u.protocol.replace(/:$/, ''),
      username: u.username,
      password: u.password,
      host: u.host,
      hostname: u.hostname,
      port: u.port,
      pathname: u.pathname,
      search: u.search,
      hash: u.hash.replace(/^#/, ''),
      queryParams: parseQuery(u.search),
    };
  } catch {
    return null;
  }
}

// ── buildURL ──────────────────────────────────────────────────────────────────

/**
 * Build a URL string from its components.
 * @param {{ protocol?: string, username?: string, password?: string, hostname?: string, port?: string, pathname?: string, queryParams?: [string,string][], hash?: string }} parts
 * @returns {string}
 */
export function buildURL(parts) {
  const protocol = (parts.protocol || 'https').replace(/:$/, '');
  const hostname = parts.hostname || '';
  const port = parts.port ? `:${parts.port}` : '';
  const userinfo =
    parts.username
      ? parts.password
        ? `${encodeURIComponent(parts.username)}:${encodeURIComponent(parts.password)}@`
        : `${encodeURIComponent(parts.username)}@`
      : '';
  const pathname = parts.pathname || '/';
  const search =
    parts.queryParams && parts.queryParams.length > 0
      ? buildQuery(parts.queryParams)
      : parts.search || '';
  const hash = parts.hash ? `#${parts.hash}` : '';
  return `${protocol}://${userinfo}${hostname}${port}${pathname}${search}${hash}`;
}

// ── parseQuery ────────────────────────────────────────────────────────────────

/**
 * Parse a query string into an array of [key, value] pairs.
 * Preserves duplicate keys and order.
 * @param {string} search — with or without leading '?'
 * @returns {[string, string][]}
 */
export function parseQuery(search) {
  if (!search) return [];
  const qs = search.startsWith('?') ? search.slice(1) : search;
  if (!qs) return [];
  return qs.split('&').map(part => {
    const eq = part.indexOf('=');
    if (eq === -1) {
      return [decodeURIComponent(part.replace(/\+/g, ' ')), ''];
    }
    const key = decodeURIComponent(part.slice(0, eq).replace(/\+/g, ' '));
    const val = decodeURIComponent(part.slice(eq + 1).replace(/\+/g, ' '));
    return [key, val];
  });
}

// ── buildQuery ────────────────────────────────────────────────────────────────

/**
 * Build a query string from an array of [key, value] pairs.
 * Returns '' when pairs is empty.
 * @param {[string, string][]} pairs
 * @returns {string} — with leading '?' if non-empty, else ''
 */
export function buildQuery(pairs) {
  if (!pairs || pairs.length === 0) return '';
  const qs = pairs
    .map(([k, v]) => {
      const ek = encodeURIComponent(k).replace(/%20/g, '+');
      const ev = encodeURIComponent(v).replace(/%20/g, '+');
      return v === '' ? ek : `${ek}=${ev}`;
    })
    .join('&');
  return `?${qs}`;
}

// ── Param helpers ─────────────────────────────────────────────────────────────

/**
 * Add a key-value pair to a params array.
 * @param {[string, string][]} pairs
 * @param {string} key
 * @param {string} value
 * @returns {[string, string][]}
 */
export function addParam(pairs, key, value) {
  return [...pairs, [key, value]];
}

/**
 * Remove a pair at the given index.
 * @param {[string, string][]} pairs
 * @param {number} index
 * @returns {[string, string][]}
 */
export function removeParam(pairs, index) {
  return pairs.filter((_, i) => i !== index);
}

/**
 * Update the key and value of the pair at the given index.
 * @param {[string, string][]} pairs
 * @param {number} index
 * @param {string} key
 * @param {string} value
 * @returns {[string, string][]}
 */
export function updateParam(pairs, index, key, value) {
  return pairs.map((pair, i) => (i === index ? [key, value] : pair));
}

// ── encode / decode ───────────────────────────────────────────────────────────

/**
 * Encode a string using percent-encoding (encodeURIComponent).
 * @param {string} str
 * @returns {string}
 */
export function encodeComponent(str) {
  if (typeof str !== 'string') return '';
  try {
    return encodeURIComponent(str);
  } catch {
    return str;
  }
}

/**
 * Decode a percent-encoded string.
 * @param {string} str
 * @returns {string}
 */
export function decodeComponent(str) {
  if (typeof str !== 'string') return '';
  try {
    return decodeURIComponent(str.replace(/\+/g, ' '));
  } catch {
    return str;
  }
}

// ── validation ────────────────────────────────────────────────────────────────

/**
 * Check if a string is a valid absolute URL.
 * @param {string} str
 * @returns {boolean}
 */
export function isValidURL(str) {
  if (!str || typeof str !== 'string') return false;
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:' ||
      u.protocol === 'ftp:' || u.protocol === 'mailto:' ||
      u.protocol.length > 0;
  } catch {
    return false;
  }
}

// ── normalizeURL ──────────────────────────────────────────────────────────────

/**
 * Normalize a URL: lowercase protocol/host, remove default ports,
 * ensure trailing slash on bare host, sort query params.
 * @param {string} str
 * @returns {string | null}
 */
export function normalizeURL(str) {
  const parsed = parseURL(str);
  if (!parsed) return null;
  // Sort query params
  const sortedParams = [...parsed.queryParams].sort(([a], [b]) =>
    a.localeCompare(b)
  );
  const normalized = buildURL({
    protocol: parsed.protocol.toLowerCase(),
    username: parsed.username,
    password: parsed.password,
    hostname: parsed.hostname.toLowerCase(),
    port: parsed.port,
    pathname: parsed.pathname || '/',
    queryParams: sortedParams,
    hash: parsed.hash,
  });
  return normalized;
}

/**
 * tests/url.test.js — Tests for url.js utilities.
 * Run with: node --test tests/url.test.js
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
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
} from '../src/url.js';

// ── parseURL ──────────────────────────────────────────────────────────────────

describe('parseURL', () => {
  it('parses a simple HTTPS URL', () => {
    const r = parseURL('https://example.com');
    assert.equal(r.protocol, 'https');
    assert.equal(r.hostname, 'example.com');
    assert.equal(r.pathname, '/');
    assert.deepEqual(r.queryParams, []);
    assert.equal(r.hash, '');
  });

  it('parses protocol, host, port', () => {
    const r = parseURL('http://api.example.com:8080/v1');
    assert.equal(r.protocol, 'http');
    assert.equal(r.hostname, 'api.example.com');
    assert.equal(r.port, '8080');
    assert.equal(r.pathname, '/v1');
  });

  it('parses username and password', () => {
    const r = parseURL('https://user:secret@example.com/');
    assert.equal(r.username, 'user');
    assert.equal(r.password, 'secret');
  });

  it('parses single query parameter', () => {
    const r = parseURL('https://example.com/?q=hello');
    assert.equal(r.queryParams.length, 1);
    assert.deepEqual(r.queryParams[0], ['q', 'hello']);
  });

  it('parses multiple query parameters', () => {
    const r = parseURL('https://example.com/?a=1&b=2&c=3');
    assert.equal(r.queryParams.length, 3);
    assert.deepEqual(r.queryParams[1], ['b', '2']);
  });

  it('parses repeated (duplicate) keys', () => {
    const r = parseURL('https://example.com/?tag=js&tag=css&tag=html');
    assert.equal(r.queryParams.length, 3);
    assert.equal(r.queryParams[0][0], 'tag');
    assert.equal(r.queryParams[2][1], 'html');
  });

  it('parses hash fragment', () => {
    const r = parseURL('https://example.com/page#section-2');
    assert.equal(r.hash, 'section-2');
  });

  it('parses full complex URL', () => {
    const r = parseURL('https://user:pw@api.example.com:9000/v2/items?page=2&q=foo#top');
    assert.equal(r.protocol, 'https');
    assert.equal(r.hostname, 'api.example.com');
    assert.equal(r.port, '9000');
    assert.equal(r.pathname, '/v2/items');
    assert.equal(r.hash, 'top');
    assert.equal(r.queryParams.length, 2);
  });

  it('decodes percent-encoded query values', () => {
    const r = parseURL('https://example.com/?q=%E6%97%A5%E6%9C%AC%E8%AA%9E');
    assert.equal(r.queryParams[0][1], '日本語');
  });

  it('decodes + as space in query string', () => {
    const r = parseURL('https://example.com/?q=hello+world');
    assert.equal(r.queryParams[0][1], 'hello world');
  });

  it('handles IPv6 host', () => {
    const r = parseURL('http://[::1]:3000/api');
    // URL API returns hostname with brackets for IPv6: "[::1]"
    assert.ok(r.hostname.includes('::1'));
    assert.equal(r.port, '3000');
    assert.equal(r.pathname, '/api');
  });

  it('handles URL without explicit port', () => {
    const r = parseURL('https://example.com/');
    assert.equal(r.port, '');
  });

  it('auto-prepends https:// for bare host', () => {
    const r = parseURL('example.com');
    assert.ok(r !== null);
    assert.equal(r.protocol, 'https');
    assert.equal(r.hostname, 'example.com');
  });

  it('returns null for empty string', () => {
    assert.equal(parseURL(''), null);
  });

  it('returns null for null input', () => {
    assert.equal(parseURL(null), null);
  });

  it('handles URL with only hash', () => {
    const r = parseURL('https://example.com/#top');
    assert.equal(r.hash, 'top');
    assert.deepEqual(r.queryParams, []);
  });

  it('handles path with no trailing slash', () => {
    const r = parseURL('https://example.com/a/b/c');
    assert.equal(r.pathname, '/a/b/c');
  });

  it('parses ftp URL', () => {
    const r = parseURL('ftp://files.example.com/pub/file.tar.gz');
    assert.equal(r.protocol, 'ftp');
    assert.equal(r.pathname, '/pub/file.tar.gz');
  });

  it('handles value-less query key', () => {
    const r = parseURL('https://example.com/?flag');
    assert.equal(r.queryParams[0][0], 'flag');
    assert.equal(r.queryParams[0][1], '');
  });
});

// ── buildURL ──────────────────────────────────────────────────────────────────

describe('buildURL', () => {
  it('builds simple URL', () => {
    const url = buildURL({ protocol: 'https', hostname: 'example.com', pathname: '/' });
    assert.ok(url.startsWith('https://example.com'));
  });

  it('includes port when specified', () => {
    const url = buildURL({ protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/' });
    assert.ok(url.includes(':3000'));
  });

  it('includes query string from pairs', () => {
    const url = buildURL({
      protocol: 'https',
      hostname: 'example.com',
      pathname: '/search',
      queryParams: [['q', 'hello'], ['lang', 'en']],
    });
    assert.ok(url.includes('q=hello'));
    assert.ok(url.includes('lang=en'));
  });

  it('includes hash', () => {
    const url = buildURL({ protocol: 'https', hostname: 'example.com', pathname: '/', hash: 'top' });
    assert.ok(url.endsWith('#top'));
  });

  it('round-trips with parseURL', () => {
    const original = 'https://api.example.com:8080/v1/items?page=1&limit=20';
    const parsed = parseURL(original);
    const rebuilt = buildURL({ ...parsed, queryParams: parsed.queryParams });
    const reparsed = parseURL(rebuilt);
    assert.equal(reparsed.hostname, parsed.hostname);
    assert.equal(reparsed.port, parsed.port);
    assert.equal(reparsed.queryParams.length, parsed.queryParams.length);
  });

  it('handles no query params (empty array)', () => {
    const url = buildURL({ protocol: 'https', hostname: 'example.com', pathname: '/', queryParams: [] });
    assert.ok(!url.includes('?'));
  });

  it('includes user info when username provided', () => {
    const url = buildURL({ protocol: 'https', username: 'user', hostname: 'example.com', pathname: '/' });
    assert.ok(url.includes('user@'));
  });
});

// ── parseQuery ────────────────────────────────────────────────────────────────

describe('parseQuery', () => {
  it('parses basic key=value', () => {
    assert.deepEqual(parseQuery('?a=1&b=2'), [['a', '1'], ['b', '2']]);
  });

  it('works without leading ?', () => {
    assert.deepEqual(parseQuery('a=1&b=2'), [['a', '1'], ['b', '2']]);
  });

  it('returns empty array for empty string', () => {
    assert.deepEqual(parseQuery(''), []);
    assert.deepEqual(parseQuery(null), []);
    assert.deepEqual(parseQuery('?'), []);
  });

  it('decodes percent-encoded values', () => {
    const pairs = parseQuery('?q=%E6%97%A5%E6%9C%AC%E8%AA%9E');
    assert.equal(pairs[0][1], '日本語');
  });

  it('decodes + as space', () => {
    const pairs = parseQuery('?q=hello+world');
    assert.equal(pairs[0][1], 'hello world');
  });

  it('handles value-less key', () => {
    const pairs = parseQuery('?flag');
    assert.equal(pairs[0][0], 'flag');
    assert.equal(pairs[0][1], '');
  });

  it('handles special chars in values', () => {
    const pairs = parseQuery('?url=https%3A%2F%2Fexample.com');
    assert.equal(pairs[0][1], 'https://example.com');
  });
});

// ── buildQuery ────────────────────────────────────────────────────────────────

describe('buildQuery', () => {
  it('builds basic query string', () => {
    const qs = buildQuery([['a', '1'], ['b', '2']]);
    assert.equal(qs, '?a=1&b=2');
  });

  it('returns empty string for empty array', () => {
    assert.equal(buildQuery([]), '');
    assert.equal(buildQuery(null), '');
  });

  it('encodes special characters', () => {
    const qs = buildQuery([['q', '日本語']]);
    assert.ok(qs.includes('%'));
    // round-trip
    const back = parseQuery(qs);
    assert.equal(back[0][1], '日本語');
  });

  it('encodes spaces as + in values', () => {
    const qs = buildQuery([['q', 'hello world']]);
    assert.ok(qs.includes('+') || qs.includes('%20'));
    const back = parseQuery(qs);
    assert.equal(back[0][1], 'hello world');
  });

  it('round-trips with parseQuery', () => {
    const original = [['page', '1'], ['limit', '20'], ['q', 'foo bar']];
    const qs = buildQuery(original);
    const back = parseQuery(qs);
    assert.deepEqual(back, original);
  });
});

// ── Param helpers ─────────────────────────────────────────────────────────────

describe('addParam', () => {
  it('adds to empty array', () => {
    const result = addParam([], 'key', 'val');
    assert.deepEqual(result, [['key', 'val']]);
  });

  it('appends to existing pairs', () => {
    const result = addParam([['a', '1']], 'b', '2');
    assert.equal(result.length, 2);
    assert.deepEqual(result[1], ['b', '2']);
  });

  it('does not mutate original array', () => {
    const orig = [['a', '1']];
    addParam(orig, 'b', '2');
    assert.equal(orig.length, 1);
  });
});

describe('removeParam', () => {
  it('removes by index', () => {
    const pairs = [['a', '1'], ['b', '2'], ['c', '3']];
    assert.deepEqual(removeParam(pairs, 1), [['a', '1'], ['c', '3']]);
  });

  it('removes first element', () => {
    const pairs = [['a', '1'], ['b', '2']];
    const result = removeParam(pairs, 0);
    assert.deepEqual(result, [['b', '2']]);
  });

  it('does not mutate original', () => {
    const pairs = [['a', '1'], ['b', '2']];
    removeParam(pairs, 0);
    assert.equal(pairs.length, 2);
  });
});

describe('updateParam', () => {
  it('updates key and value at index', () => {
    const pairs = [['a', '1'], ['b', '2']];
    const result = updateParam(pairs, 0, 'x', '99');
    assert.deepEqual(result[0], ['x', '99']);
    assert.deepEqual(result[1], ['b', '2']);
  });

  it('does not mutate original', () => {
    const pairs = [['a', '1']];
    updateParam(pairs, 0, 'z', '9');
    assert.deepEqual(pairs[0], ['a', '1']);
  });
});

// ── encodeComponent / decodeComponent ────────────────────────────────────────

describe('encodeComponent', () => {
  it('encodes special characters', () => {
    assert.ok(encodeComponent('hello world').includes('%20'));
  });

  it('encodes Japanese characters', () => {
    const enc = encodeComponent('日本語');
    assert.ok(enc.startsWith('%'));
    assert.notEqual(enc, '日本語');
  });

  it('handles empty string', () => {
    assert.equal(encodeComponent(''), '');
  });

  it('returns string for non-string input', () => {
    assert.equal(typeof encodeComponent(null), 'string');
  });
});

describe('decodeComponent', () => {
  it('decodes percent-encoded string', () => {
    assert.equal(decodeComponent('%E6%97%A5%E6%9C%AC%E8%AA%9E'), '日本語');
  });

  it('decodes + as space', () => {
    assert.equal(decodeComponent('hello+world'), 'hello world');
  });

  it('handles empty string', () => {
    assert.equal(decodeComponent(''), '');
  });

  it('round-trips with encodeComponent', () => {
    const original = 'hello world & "quotes" <special>';
    assert.equal(decodeComponent(encodeComponent(original)), original);
  });

  it('returns original on malformed input', () => {
    const malformed = '%GG%HH';
    const result = decodeComponent(malformed);
    assert.equal(typeof result, 'string');
  });
});

// ── isValidURL ────────────────────────────────────────────────────────────────

describe('isValidURL', () => {
  it('returns true for valid https URL', () => {
    assert.equal(isValidURL('https://example.com'), true);
  });

  it('returns true for valid http URL', () => {
    assert.equal(isValidURL('http://example.com/path?q=1'), true);
  });

  it('returns true for ftp URL', () => {
    assert.equal(isValidURL('ftp://files.example.com/file.tar'), true);
  });

  it('returns false for bare domain (no protocol)', () => {
    assert.equal(isValidURL('example.com'), false);
  });

  it('returns false for empty string', () => {
    assert.equal(isValidURL(''), false);
  });

  it('returns false for null', () => {
    assert.equal(isValidURL(null), false);
  });

  it('returns false for random text', () => {
    assert.equal(isValidURL('not a url'), false);
  });
});

// ── normalizeURL ──────────────────────────────────────────────────────────────

describe('normalizeURL', () => {
  it('lowercases protocol', () => {
    const n = normalizeURL('HTTPS://Example.COM/');
    assert.ok(n.startsWith('https://'));
  });

  it('sorts query params alphabetically', () => {
    const n = normalizeURL('https://example.com/?z=1&a=2&m=3');
    const pairs = parseQuery(n.split('?')[1] || '');
    assert.equal(pairs[0][0], 'a');
    assert.equal(pairs[1][0], 'm');
    assert.equal(pairs[2][0], 'z');
  });

  it('returns null for invalid input', () => {
    assert.equal(normalizeURL('not a url'), null);
  });

  it('preserves pathname', () => {
    const n = normalizeURL('https://example.com/a/b/c');
    assert.ok(n.includes('/a/b/c'));
  });
});

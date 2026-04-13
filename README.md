# URL Parser

URL parser and query string editor with live reconstruction and percent encoding tools.

[![Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://sen.ltd/portfolio/url-parser/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

- **Parse URL** into protocol, host, port, path, query params, hash
- **Edit any component** and rebuild the URL live
- **Query string editor** — table with add / remove / edit per parameter
- **Percent-encode / decode** tool with raw display alongside decoded values
- **URL validation** — checks if the input is a structurally valid URL
- **URL normalization** — lowercase protocol/host, sorted query params
- **Short-form concept display** — shows what a shortened URL might look like
- **Built-in examples** — IPv6, Japanese query params, auth credentials, CDN URLs
- **Japanese / English UI** toggle
- **Dark / Light theme** (auto-detects `prefers-color-scheme`)
- Zero dependencies, no build step

## Quick Start

```bash
# Serve locally
npm run serve
# → open http://localhost:8080
```

## Run Tests

```bash
npm test
```

Requires Node.js 18+.

## Tech

- Vanilla JS (ES modules)
- Native `URL` API for parsing
- `node:test` + `node:assert` for tests
- No framework, no bundler

## License

MIT — see [LICENSE](LICENSE).

---

Built by [SEN LLC](https://sen.ltd) · [Portfolio](https://sen.ltd/portfolio/)

# library-ihm — agent guide

Single-page React frontend for a library management system. Requires the [library-ws](https://github.com/Nespouique/library-ws) backend API.

## Quick start

```bash
npm install --legacy-peer-deps   # peer dep conflict: eslint-config-react-app 7 requires eslint 8, project uses eslint 9
npm run dev                      # Vite dev server on http://localhost:5173
```

Pre-commit hook runs `npm run validate` (lint + format:check + build) — can be slow.

## Architecture

- **Framework**: React 18 + Vite 4 + Tailwind CSS 3 (with shadcn/ui, new-york style, JSX not TSX)
- **PWA**: vite-plugin-pwa with auto-update, fullscreen display, service worker cache
- **Routing**: react-router-dom v6 — routes in `src/App.jsx`
- **Routing paths**: `/` (books), `/auteurs`, `/etageres`, `/kubes` (SVG spatial layout)
- **API layer**: `src/services/api.js` — class-based services (`AuthorsService`, `BooksService`, `ShelvesService`) hitting `/api/*`, proxied by Vite to `http://localhost:3000` (strips `/api` prefix)
- **External APIs**: Google Books (`VITE_GOOGLE_BOOKS_API_KEY` in `.env.production`) + Open Library
- **State**: no global state library — components fetch directly via service singletons
- **UI**: Radix UI primitives, `cn()` utility (`clsx` + `tailwind-merge`) at `@/lib/utils`
- **No tests yet** — ESLint config has test globals suggesting Jest/Vitest planned

## Key commands

| Command                | Action                          |
| ---------------------- | ------------------------------- |
| `npm run dev`          | Dev server (port 5173)          |
| `npm run build`        | Production build → `dist/`      |
| `npm run preview`      | Preview production build        |
| `npm run lint`         | ESLint check                    |
| `npm run lint:fix`     | ESLint auto-fix                 |
| `npm run format`       | Prettier write                  |
| `npm run format:check` | Prettier check                  |
| `npm run quality`      | `lint && format:check`          |
| `npm run quality:fix`  | `lint:fix && format`            |
| `npm run validate`     | `lint && format:check && build` |

## Backend dependency

library-ws must run on `http://localhost:3000`. Dev proxy routes `/api/*` → `http://localhost:3000/*`.

MySQL + DB user must exist. The backend auto-creates tables and seeds example data on `npm start`.

## Style conventions

- **Prettier**: `singleQuote: true`, `tabWidth: 4`, `trailingComma: "es5"`, `semi: true`, `printWidth: 80`
- **Path alias**: `@/` → `./src/` (configured in vite.config.js, jsconfig.json, and tailwind.config.js)
- **ESLint**: `no-unused-vars: warn`, `prefer-const: error`, `eqeqeq: error`
- Ignore patterns: `dist/`, `node_modules/`, `.env*`, `build/`, `coverage/`, `plugins/visual-editor/vite-plugin-react-inline-editor.js`

## Notable files

- `src/services/api.js` — all API service classes and external book metadata lookup
- `src/lib/kubeUtils.js` — SVG spatial layout utilities
- `public/kubes.svg` — uploadable SVG for shelf spatial visualization
- `plugins/visual-editor/` — custom Vite plugin (ignored by prettier)
- `.env.production` — Google Books API key (`VITE_GOOGLE_BOOKS_API_KEY`)
- `nginx.conf` — production nginx config with SPA fallback and PWA cache headers

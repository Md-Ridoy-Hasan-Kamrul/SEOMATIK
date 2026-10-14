# Seomatik

Minimal **Astro + React** starter: one landing page, Tailwind v4, room to grow an animated marketing site.

---

## Stack

| Layer | Choice |
| ----- | ------ |
| Framework | [Astro 7](https://docs.astro.build) |
| Islands | [React 19](https://react.dev) via `@astrojs/react` |
| Styles | Tailwind CSS v4 (`src/styles/global.css`) |
| Deploy | Vercel adapter |
| Tests | Vitest (unit) + Playwright (E2E) |

`astro.config.mjs` includes `react()` — interactive UI belongs in `src/components/islands/*.tsx` with `client:*` directives. Static markup stays in `.astro`.

---

## Project layout

```
src/
  pages/           # index.astro (landing), 404.astro
  layouts/         # Layout.astro
  components/
    islands/       # React islands (motion, carousels, etc.)
  styles/
e2e/               # Playwright — asserts landing copy in index.astro
docs/
  Rules for React code quality.md
  AI feature prompt.md
```

---

## Commands

```bash
npm install
astro dev --background   # local dev (see AGENTS.md)
npm run build
npm test                 # Vitest
npm run test:e2e         # Playwright (heading + title on `/`)
```

---

## Docs for AI / contributors

- [`docs/Rules for React code quality.md`](docs/Rules%20for%20React%20code%20quality.md) — islands, hooks, hydration
- [`docs/AI feature prompt.md`](docs/AI%20feature%20prompt.md) — copy-paste prompts for new sections

Owner often writes in **Bangla + English**; keep explanations simple.

---

## E2E contract

Playwright (`e2e/home.spec.ts`) expects:

- Document title matching **Seomatik** (from `Layout.astro` / `index.astro`)
- `<h1>Your animated site starts here</h1>` on `/` (`src/pages/index.astro`)

If you change landing copy, update the test in the same PR.

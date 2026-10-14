# Rules for Svelte code quality

> Source of truth for **Astro + Svelte 5** in this repo.  
> There is **no React** here — do not use React hooks, JSX patterns, or `sonner` (React). Use **Svelte 5 runes**, `.svelte` / `.astro`, and **`svelte-sonner`** for toasts.

When this file is mentioned with `README.md`, follow both. Prefer this file for component-level quality; prefer `README.md` for stack roles, folders, and testing architecture.

---

## A. File type rules

| Extension | Use for | Do not |
| --------- | ------- | ------ |
| `.astro` | Pages, layouts, static sections, server islands | Client state, Query, Zustand, toasts |
| `.svelte` | Interactive islands only (`client:*`) | Become the whole page shell |
| `.ts` | API, stores, query helpers, pure logic, tests | UI markup |
| `.svelte.ts` | Shared runes / Svelte-aware helpers (e.g. `useZustandStore`) | Heavy UI |

---

## B. Svelte 5 component rules (pure & clear)

1. **One job per component** — layout chrome, one section, or one interactive island.
2. **Props** — typed with TypeScript; prefer `$props()` in Svelte 5.
3. **State** — `$state` / `$derived` / `$effect` only inside `.svelte` or `.svelte.ts`. No React `useState` / `useEffect`.
4. **Effects** — keep `$effect` small; prefer `$derived` for computed values. Clean up subscriptions in the effect return.
5. **No magic numbers** — name constants (`STALE_MS`, `MAX_RETRIES`) near the logic or in `lib/`.
6. **One level of abstraction per function** — a function either orchestrates steps *or* does one concrete thing, not both mixed.
7. **Business logic out of markup** — Axios in `lib/api`, Query keys/client in `lib/query`, UI status in `stores/`, toast calls from event handlers or small helpers.
8. **Tailwind** — utility classes on elements; always `class="..."` with quotes. Theme tokens live in `src/styles/global.css` (`@theme`).
9. **Client directives** — `client:load` above the fold; `client:visible` / `client:idle` below. Never hydrate static-only Astro.
10. **Toasts** — `import { toast } from 'svelte-sonner'`; `<Toaster />` only via `ToastHost` (`client:idle` on landing; `client:load` when toasts are primary UX).

---

## C. Data & state rules

1. **Axios** = HTTP only.
2. **TanStack Query** = server cache + loading/error/refetch.
3. **Zustand** = client UI / HTTP status only — **never** API payloads.
4. **svelte-sonner** = user-facing feedback (success / error / info), not a data store.

---

## D. Testing rules (TDD when implementing a feature)

1. **Vitest first** for stores, `lib/*`, and Astro Container HTML tests — write failing tests, then implement.
2. **Playwright** only for full-page E2E in `e2e/`.
3. Reset Zustand in `beforeEach`; mock Axios/network at the boundary when testing UI logic.
4. Do not introduce Jest or other legacy runners.

---

## E. Isolation & safety

1. Change only files needed for the requested feature.
2. Do not drive-by refactor unrelated sections.
3. Valid HTML: every opened tag must close (`</span>`, etc.).
4. Prefer official Astro / Svelte / TanStack / Vitest docs when unsure.

---

## F. A–Z feature checklist (before marking done)

- [ ] A — Read `README.md` + this file  
- [ ] B — Confirm file placement (`pages` / `sections` / `islands` / `lib` / `stores`)  
- [ ] C — Pick `.astro` vs `.svelte` correctly  
- [ ] D — Tests written first (Vitest; E2E only if full-page flow)  
- [ ] E — Implement with Tailwind + typed props  
- [ ] F — Loading / empty / error / success states if data-fetching  
- [ ] G — Toast only for user-facing feedback when useful  
- [ ] H — Responsive: desktop, ~1020, 768, 425, 375, 320  
- [ ] I — No magic numbers; one abstraction level per function  
- [ ] J — Axios / Query / Zustand roles unchanged  
- [ ] K — `npm test` (and E2E if applicable) pass  
- [ ] L — Self-review: abstraction + magic numbers called out and fixed  

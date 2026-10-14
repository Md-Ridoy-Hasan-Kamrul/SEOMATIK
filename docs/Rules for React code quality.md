# Rules for React code quality

> Source of truth for **Astro + React** in this repo.  
> Interactive UI lives in **React islands** (`.jsx` / `.tsx`) with `client:*` directives. Static markup stays in **`.astro`**.

When this file is mentioned with `README.md`, follow both. Prefer this file for component-level quality; prefer `README.md` for folders and testing.

---

## A. File type rules

| Extension | Use for | Do not |
| --------- | ------- | ------ |
| `.astro` | Pages, layouts, static sections | Client state inside static-only trees without islands |
| `.jsx` / `.tsx` | Interactive islands (`client:load`, `client:visible`, etc.) | Whole site shell unless intentional |
| `.ts` | API helpers, pure logic, tests | UI markup |

---

## B. React component rules

1. **One job per component** — one section or one interactive island.
2. **Props** — typed with TypeScript where using `.tsx`.
3. **State** — `useState`, `useReducer`, `useMemo`, `useEffect` in islands only. No hooks in `.astro` frontmatter.
4. **Effects** — small `useEffect` blocks; return cleanup for subscriptions, timers, and animation frames.
5. **Business logic** — keep fetch/helpers in `src/lib/`; islands orchestrate UI.
6. **Tailwind** — utility classes; theme tokens in `src/styles/global.css` (`@theme`).
7. **Hydration** — prefer `client:visible` or `client:idle` for below-fold motion; `client:load` when interaction is needed immediately.
8. **Accessibility** — labels, `aria-*`, keyboard support, respect `prefers-reduced-motion`.

---

## C. Astro integration

```astro
---
import HeroMotion from '../components/islands/HeroMotion.tsx';
---
<section>
  <HeroMotion client:visible />
</section>
```

Do **not** add `@astrojs/svelte` or `.svelte` islands unless the stack is deliberately changed in `astro.config.mjs` and this doc is updated.

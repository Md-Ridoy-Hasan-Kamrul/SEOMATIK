# AI feature prompt (Astro + React)

**Location:** `docs/AI feature prompt.md` (this file)  
**Rules:** `docs/Rules for React code quality.md`  
**README:** stack, layout, E2E contract

Copy a block below and paste it into chat.

---

## Single section (most common)

```md
# Role & Prerequisites
Act as a Principal Frontend Architect. Before writing code, read:
1. `README.md` (stack, folders, E2E contract).
2. `docs/Rules for React code quality.md` (islands, hooks, hydration).
3. Figma: [Insert Figma Link] — or match `src/styles/global.css` and the landing page.

# Task
Implement **one section** `[Insert Section Name]`:
- Static markup → `src/components/sections/*.astro` or inline in `src/pages/index.astro`
- Motion / interaction → `src/components/islands/*.tsx` with the right `client:*` directive

# Constraints
- **Stack:** Astro + React + Tailwind v4 only (matches `react()` in `astro.config.mjs`).
- **Responsive:** 320px → desktop.
- **Scope:** Minimal wiring only; do not break unrelated files.
- **Tests:** Vitest for logic/components; Playwright only when full-page behavior changes.

# Output order
1. Analysis
2. Tests (if applicable)
3. Implementation
4. Self-review (one abstraction level per function; no magic numbers)
```

---

## Full page / bigger feature

Same as above, but scope to `[Insert Page/Component Name]` and list all files you will touch.

Use **Motion**, **GSAP**, or **Lenis** only when the task needs them; install locally with `npm install`.

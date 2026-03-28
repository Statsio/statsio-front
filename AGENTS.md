# AGENTS.md

## Purpose
- This repository is a Vue 3 + Vite frontend for Statsio.
- Prefer small, targeted edits that preserve the current visual direction and existing component structure.

## Stack
- Vue 3 with `<script setup lang="ts">`
- Vite
- Vue Router
- Pinia
- Tailwind CSS v4 utilities mixed with local CSS tokens and SCSS helpers
- Vitest for unit tests

## Commands
- Install: `npm install`
- Dev server: `npm run dev`
- Type-check: `npm run type-check`
- Build: `npm run build`
- Tests: `npm run test:unit`
- Lint: `npm run lint`
- Format: `npm run format`

## Project Conventions
- Use TypeScript in Vue SFCs.
- Prefer alias imports with `@/` for files under `src` when the project already uses that pattern.
- Keep components focused and composable. Avoid adding large amounts of inline logic to views when a dedicated component or composable is clearer.
- Reuse existing UI primitives before creating new ones, especially [`src/components/ui/AppButton.vue`](/home/corentingesse/statsio-project/statsio-front/src/components/ui/AppButton.vue).
- Reuse the existing design tokens in [`src/assets/tokens.css`](/home/corentingesse/statsio-project/statsio-front/src/assets/tokens.css) and shared surface helpers in [`src/assets/theme.scss`](/home/corentingesse/statsio-project/statsio-front/src/assets/theme.scss).
- Preserve French product copy unless the user explicitly asks for another language.
- Keep naming aligned with scope: `App*` for shared layout/application components, feature-specific prefixes only when the component is truly local to that feature.

## Styling Guidelines
- Prefer existing utility patterns already present in the repo over introducing a new styling approach.
- Use CSS variables such as `--color-primary`, `--color-secondary`, and `--color-accent` instead of hardcoding a new palette unless the task requires a design change.
- Keep visual hierarchy strong and product-oriented. This homepage is intentionally more editorial/marketing-driven than a default app shell.
- Maintain responsive behavior for mobile and desktop. Check fixed headers, section spacing, and CTA wrapping.

## Accessibility
- Preserve keyboard navigation and focus states.
- Do not remove reduced-motion handling or skip links.
- Interactive controls must have clear labels and sensible semantics.

## Routing And Auth
- Existing routes live in [`src/router/index.ts`](/home/corentingesse/statsio-project/statsio-front/src/router/index.ts).
- Auth-aware UI already exists in navigation and store-backed flows. Preserve `guestOnly` and `requiresAuth` behavior when adding pages or links.

## Editing Guardrails
- The working tree may already contain user changes. Do not revert unrelated modifications.
- When changing a shared component, check where it is used before altering its API.
- For homepage work, also read [`src/components/home/AGENTS.md`](/home/corentingesse/statsio-project/statsio-front/src/components/home/AGENTS.md).
- For shared navigation, banner, or footer work, also read [`src/components/layout/AGENTS.md`](/home/corentingesse/statsio-project/statsio-front/src/components/layout/AGENTS.md).

# AGENTS.md

## Scope
- Applies to files under `src/components/layout`.
- This folder contains shared structural UI used across multiple pages: header, promo banner, footer, and future app-wide layout blocks.

## Naming
- Use `App*` names for globally shared layout components.
- Do not use `Home*` prefixes here unless the component is strictly homepage-only.

## Responsibilities
- Layout components can include app-wide navigation, auth-aware controls, global promo surfaces, and footer content.
- Keep business content generic enough to work across views. Page-specific editorial content belongs in views or feature folders.

## UX Constraints
- Fixed layout elements must stay coordinated with page top padding.
- Preserve auth behavior in shared navigation.
- Preserve reduced-motion handling for rotating or animated global UI.

# AGENTS.md

## Scope
- Applies to files under `src/components/home`.
- These components build the marketing/editorial homepage assembled in [`src/views/HomeView.vue`](/home/corentingesse/statsio-project/statsio-front/src/views/HomeView.vue).
- Shared site-wide layout elements do not belong here. Put them in `src/components/layout`.

## Composition Rules
- Keep `HomeView.vue` as an orchestration layer with section data and component ordering.
- Keep section components presentational when possible. If behavior becomes reusable or stateful, move it to a composable.
- Prefer adding or extending props instead of hardcoding more content inside section components.

## UX And Visual Direction
- Preserve the current premium editorial feel: bold hero, strong cards, clear KPIs, and product storytelling.
- Avoid generic SaaS layouts. The homepage should feel like a data-media product, not an admin dashboard.
- Reuse existing section primitives such as badges, panels, muted panels, mono labels, and CTA patterns.
- Homepage sections must remain compatible with the shared layout stack above them.

## Accessibility And Motion
- If a homepage-specific component animates, support reduced motion. For the shared promo banner pattern, refer to [`src/components/layout/AppPromoBanner.vue`](/home/corentingesse/statsio-project/statsio-front/src/components/layout/AppPromoBanner.vue).
- Preserve skip-link compatibility with the homepage main landmark.
- Hover-only interactions should still degrade safely for keyboard and touch contexts.

## Navigation And CTAs
- Prefer real routes when a destination exists.
- If a link remains a placeholder, keep the placeholder obvious and avoid implying a finished flow.
- Homepage CTAs should map to core product actions: articles, stats data, polls, auth, or profile.

## Content Guidance
- Keep copy concise, product-specific, and in French unless requested otherwise.
- Demo data should remain coherent with the Statsio positioning: data journalism, sources, trends, polling, and analytics.
- Avoid inserting fake precision that looks like production data unless the task explicitly needs realistic mock content.

## Change Checklist
- Check header overlap and section spacing after editing fixed elements.
- Check mobile wrapping for nav, CTAs, and KPI blocks.
- If you change shared homepage patterns, review neighboring components for consistency.

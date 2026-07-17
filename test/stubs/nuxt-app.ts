// Stub resolved for the '#app' Nuxt virtual alias under Vitest (see vitest.config.ts).
// Nuxt injects '#app' at build time; outside of a real Nuxt build this module doesn't
// exist, so tests that import files relying on it (e.g. middleware) mock it via
// `vi.mock('#app', ...)`, which requires '#app' to resolve to a real file first.
export const defineNuxtRouteMiddleware = <T extends (...args: never[]) => unknown>(fn: T) => fn
export const navigateTo = (..._args: unknown[]) => undefined

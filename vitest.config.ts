import { fileURLToPath } from 'node:url'
import { defineConfig, configDefaults, type Plugin } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

/**
 * Vite/oxc's `define` only text-replaces plain identifiers, not `import.meta.*`
 * member expressions, outside of full build mode — the dev/test transform keeps
 * `import.meta` as a real object, so custom props resolve to `undefined` instead of
 * being substituted. Nuxt normally injects `import.meta.client` / `import.meta.server`
 * itself at build time; under plain Vitest we replicate that here.
 */
function stubNuxtImportMeta(): Plugin {
  return {
    name: 'stub-nuxt-import-meta',
    enforce: 'pre',
    transform(code) {
      if (!code.includes('import.meta.client') && !code.includes('import.meta.server')) return null
      return code
        .replaceAll('import.meta.client', 'true')
        .replaceAll('import.meta.server', 'false')
    },
  }
}

export default defineConfig({
  plugins: [stubNuxtImportMeta(), vue()],
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'e2e/**'],
    root: fileURLToPath(new URL('./', import.meta.url)),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./app', import.meta.url)),
      '#app': fileURLToPath(new URL('./test/stubs/nuxt-app.ts', import.meta.url)),
    },
  },
})

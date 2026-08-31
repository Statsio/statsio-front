/**
 * Certaines combinaisons Vitest 4 / jsdom 30 / Node ≥ 26 n'exposent pas
 * `window.localStorage` / `window.sessionStorage` sur le global (jsdom les
 * implémente pourtant correctement en isolation). On installe un Storage
 * en mémoire quand il manque — no-op sur les environnements où jsdom l'a déjà
 * fourni (CI en Node 24), donc sans effet de bord sur le comportement testé.
 */
class MemoryStorage implements Storage {
  #store = new Map<string, string>()

  get length(): number {
    return this.#store.size
  }

  clear(): void {
    this.#store.clear()
  }

  getItem(key: string): string | null {
    return this.#store.has(key) ? this.#store.get(key)! : null
  }

  key(index: number): string | null {
    return [...this.#store.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.#store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.#store.set(key, String(value))
  }
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  const missing =
    !(name in globalThis) ||
    (globalThis as unknown as Record<string, unknown>)[name] == null

  if (missing) {
    const storage = new MemoryStorage()
    Object.defineProperty(globalThis, name, { value: storage, configurable: true, writable: true })
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, name, { value: storage, configurable: true, writable: true })
    }
  }
}

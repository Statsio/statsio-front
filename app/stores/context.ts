import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export interface ContextState {
  [key: string]: string | number | boolean | null
}

export const useContextStore = defineStore('context', () => {
  const route = useRoute()
  const router = useRouter()

  // Global context state from URL params
  const context = ref<ContextState>({})

  // History of context changes
  const contextHistory = ref<ContextState[]>([])

  /**
   * Initialize context from URL query parameters
   */
  function initFromUrl() {
    const params: ContextState = {}

    for (const [key, value] of Object.entries(route.query)) {
      if (value !== null && value !== undefined) {
        params[key] = parseValue(value as string)
      }
    }

    context.value = params
    addToHistory(params)
  }

  /**
   * Parse URL parameter value to appropriate type
   */
  function parseValue(value: string): string | number | boolean {
    // Try to parse as number
    if (!isNaN(Number(value)) && value !== '') {
      return Number(value)
    }

    // Parse boolean
    if (value === 'true') return true
    if (value === 'false') return false

    // Return as string
    return value
  }

  /**
   * Update context and sync to URL
   */
  function updateContext(updates: Partial<ContextState>, replace = false) {
    const newContext = replace ? { ...updates } : { ...context.value, ...updates }

    // Remove null/undefined values
    Object.keys(newContext).forEach(key => {
      if (newContext[key] === null || newContext[key] === undefined) {
        delete newContext[key]
      }
    })

    context.value = newContext
    addToHistory(newContext)
    syncToUrl()
  }

  /**
   * Set a single context value
   */
  function setContext(key: string, value: string | number | boolean | null) {
    if (value === null || value === undefined) {
      removeContext(key)
    } else {
      updateContext({ [key]: value })
    }
  }

  /**
   * Remove a context key
   */
  function removeContext(key: string) {
    const newContext = { ...context.value }
    delete newContext[key]
    context.value = newContext
    addToHistory(newContext)
    syncToUrl()
  }

  /**
   * Clear all context
   */
  function clearContext() {
    context.value = {}
    addToHistory({})
    syncToUrl()
  }

  /**
   * Sync context to URL query parameters
   */
  function syncToUrl() {
    if (!import.meta.client) return
    const query: Record<string, string> = {}

    for (const [key, value] of Object.entries(context.value)) {
      query[key] = String(value)
    }

    router.push({ query })
  }

  /**
   * Add context state to history
   */
  function addToHistory(state: ContextState) {
    contextHistory.value.push({ ...state })

    // Keep only last 50 states
    if (contextHistory.value.length > 50) {
      contextHistory.value.shift()
    }
  }

  /**
   * Get context value by key
   */
  function getContext(key: string): string | number | boolean | null {
    return context.value[key] ?? null
  }

  /**
   * Check if context has a key
   */
  function hasContext(key: string): boolean {
    return key in context.value
  }

  /**
   * Get all context keys
   */
  const contextKeys = computed(() => Object.keys(context.value))

  /**
   * Get context as object
   */
  const contextObject = computed(() => ({ ...context.value }))

  /**
   * Check if context is empty
   */
  const isEmpty = computed(() => Object.keys(context.value).length === 0)

  /**
   * Get context as URL query string
   */
  const queryString = computed(() => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(context.value)) {
      params.append(key, String(value))
    }
    return params.toString()
  })

  /**
   * Replace template variables in a string with context values
   * Example: "{{context.city}}" -> "Paris"
   */
  function replaceTemplateVars(template: string): string {
    return template.replace(/\{\{context\.(\w+)\}\}/g, (match, key) => {
      const value = context.value[key]
      return value !== undefined ? String(value) : match
    })
  }

  /**
   * Replace template variables in an object recursively
   */
  function replaceTemplateVarsInObject<T>(obj: T): T {
    if (typeof obj === 'string') {
      return replaceTemplateVars(obj) as T
    }

    if (Array.isArray(obj)) {
      return obj.map(item => replaceTemplateVarsInObject(item)) as T
    }

    if (obj !== null && typeof obj === 'object') {
      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        result[key] = replaceTemplateVarsInObject(value)
      }
      return result as T
    }

    return obj
  }

  /**
   * Apply context to filters object
   * Replaces template variables and returns resolved filters
   */
  function applyContextToFilters(filters: Record<string, any>): Record<string, any> {
    return replaceTemplateVarsInObject(filters)
  }

  // Watch route changes and update context
  watch(
    () => route.query,
    () => {
      initFromUrl()
    },
    { immediate: true }
  )

  return {
    // State
    context,
    contextHistory,

    // Computed
    contextKeys,
    contextObject,
    isEmpty,
    queryString,

    // Actions
    initFromUrl,
    updateContext,
    setContext,
    removeContext,
    clearContext,
    getContext,
    hasContext,
    replaceTemplateVars,
    replaceTemplateVarsInObject,
    applyContextToFilters,
  }
})

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  action: string
  siteKey?: string
}>()

const emit = defineEmits<{
  verified: [token: string]
  expired: []
  error: []
}>()

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

const SCRIPT_BASE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
const SCRIPT_SRC = `${SCRIPT_BASE_SRC}?onload=onTurnstileLoad&render=explicit`

const config = useRuntimeConfig()
const resolvedSiteKey = props.siteKey ?? config.public.turnstileSiteKey

const container = ref<HTMLElement | null>(null)
let widgetId: string | undefined

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()

  return new Promise((resolve) => {
    window.onTurnstileLoad = resolve

    if (document.querySelector(`script[src^="${SCRIPT_BASE_SRC}"]`)) return

    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  })
}

function renderWidget() {
  if (!container.value || !window.turnstile || !resolvedSiteKey) return

  widgetId = window.turnstile.render(container.value, {
    sitekey: resolvedSiteKey,
    action: props.action,
    callback: (token: string) => emit('verified', token),
    'expired-callback': () => emit('expired'),
    'error-callback': () => emit('error'),
  })
}

function reset() {
  if (widgetId && window.turnstile) window.turnstile.reset(widgetId)
}

defineExpose({ reset })

onMounted(async () => {
  await loadScript()
  renderWidget()
})

onBeforeUnmount(() => {
  if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
})
</script>

<template>
  <div ref="container" />
</template>

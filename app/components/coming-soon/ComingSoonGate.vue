<script setup lang="ts">
import { ref, onMounted } from 'vue'

const config = useRuntimeConfig()
const raw = config.public.comingSoon
const bypassCode = config.public.comingSoonBypassCode as string

const BYPASS_KEY = 'statsio.comingSoon.bypass'
const isComingSoon = ref(String(raw).trim() === 'true')

onMounted(() => {
  if (!isComingSoon.value || !bypassCode) return

  try {
    if (localStorage.getItem(BYPASS_KEY) === bypassCode) {
      isComingSoon.value = false
      return
    }

    const params = new URLSearchParams(window.location.search)
    if (params.has(bypassCode)) {
      localStorage.setItem(BYPASS_KEY, bypassCode)
      isComingSoon.value = false

      params.delete(bypassCode)
      const query = params.toString()
      const newUrl = window.location.pathname + (query ? `?${query}` : '') + window.location.hash
      window.history.replaceState({}, '', newUrl)
    }
  } catch {
    // localStorage indisponible (navigation privée...) : le bypass ne sera pas mémorisé
  }
})
</script>

<template>
  <ComingSoonPage v-if="isComingSoon" />
  <slot v-else />
</template>

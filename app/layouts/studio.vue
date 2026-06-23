<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const appTheme = computed(() => (route.path.startsWith('/tvstats') ? 'tvstats' : undefined))
</script>

<template>
  <div
    :data-theme="appTheme"
    class="h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  docTitle: string
  docSlug: string
  category?: string | null
  accentColor?: string | null
}>()
</script>

<template>
  <nav class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#18181f]/45">
    <RouterLink to="/statsdata" class="shrink-0 transition-colors hover:text-primary">StatsData</RouterLink>
    <template v-if="category">
      <span>/</span>
      <span class="shrink-0">{{ category }}</span>
    </template>
    <span>/</span>
    <RouterLink
      :to="`/statsdata/${docSlug}`"
      class="max-w-[180px] min-w-0 truncate font-semibold transition-colors hover:opacity-75 sm:max-w-xs"
      :style="{ color: accentColor || 'var(--color-primary)' }"
    >
      {{ docTitle }}
    </RouterLink>
  </nav>
</template>

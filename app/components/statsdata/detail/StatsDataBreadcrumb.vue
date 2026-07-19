<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { publicContentPath, publicContentListPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'

const props = defineProps<{
  docTitle: string
  docSlug: string
  category?: string | null
  accentColor?: string | null
}>()

const basePath = useContentBasePath()
const listPath = computed(() => publicContentListPath('statsdata', basePath.value))
const docPath = computed(() => publicContentPath('statsdata', props.docSlug, basePath.value))
</script>

<template>
  <nav class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#18181f]/45">
    <RouterLink :to="listPath" class="shrink-0 transition-colors hover:text-primary">StatsData</RouterLink>
    <template v-if="category">
      <span>/</span>
      <span class="shrink-0">{{ category }}</span>
    </template>
    <span>/</span>
    <RouterLink
      :to="docPath"
      class="max-w-[180px] min-w-0 truncate font-semibold transition-colors hover:opacity-75 sm:max-w-xs"
      :style="{ color: accentColor || 'var(--color-primary)' }"
    >
      {{ docTitle }}
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  docSlug: string
  pages: { id: string; title: string; slug?: string; icon?: string }[]
  activePageId?: string | null
  accentColor?: string | null
}>()

function pageLink(docSlug: string, page: { id: string; slug?: string }) {
  return `/statsdata/${docSlug}/${page.slug ?? page.id}`
}
</script>

<template>
  <div class="flex gap-7 overflow-x-auto border-b border-[#18181f]/[0.08]">
    <RouterLink
      v-for="page in pages"
      :key="page.id"
      :to="pageLink(docSlug, page)"
      class="-mb-px inline-flex shrink-0 items-center gap-1 whitespace-nowrap border-b-2 pb-3.5 text-sm leading-none transition-colors"
      :class="activePageId === page.id
        ? 'font-bold text-[#18181f]'
        : 'border-transparent font-semibold text-[#18181f]/50 hover:text-[#18181f]/75'"
      :style="activePageId === page.id ? { borderColor: accentColor || 'var(--color-primary)' } : undefined"
    >
      <span v-if="page.icon" class="leading-none">{{ page.icon }}</span>{{ page.title }}
    </RouterLink>
  </div>
</template>

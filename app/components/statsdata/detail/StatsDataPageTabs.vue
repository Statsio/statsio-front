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
  <div class="flex w-max max-w-full items-center gap-[3px] overflow-x-auto rounded-full bg-[var(--studio-note)] p-[3px]">
    <RouterLink
      v-for="page in pages"
      :key="page.id"
      :to="pageLink(docSlug, page)"
      class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-[13px] py-1.5 text-[12px] font-bold transition-colors"
      :class="activePageId === page.id
        ? 'bg-white text-[var(--studio-ink)] shadow-sm'
        : 'text-[var(--studio-muted)] hover:text-[var(--studio-ink)]'"
    >
      <span v-if="page.icon" class="leading-none">{{ page.icon }}</span>{{ page.title }}
    </RouterLink>
  </div>
</template>

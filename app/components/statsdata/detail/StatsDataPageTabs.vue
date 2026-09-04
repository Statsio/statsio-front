<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

type TabPage = { id: string; title: string; slug?: string; icon?: string }

const props = defineProps<{
  docSlug: string
  pages: TabPage[]
  activePageId?: string | null
  accentColor?: string | null
}>()

const router = useRouter()

function pageLink(page: { id: string; slug?: string }) {
  return `/statsdata/${props.docSlug}/${page.slug ?? page.id}`
}

const activeValue = computed(() => {
  const active = props.pages.find((p) => p.id === props.activePageId)
  return active ? pageLink(active) : ''
})

function onSelect(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (value && value !== router.currentRoute.value.path) void router.push(value)
}
</script>

<template>
  <!-- Mobile + tablette : sélecteur de page -->
  <div class="relative shrink-0 lg:hidden">
    <select
      :value="activeValue"
      class="max-w-[190px] appearance-none rounded-full bg-[var(--studio-note)] py-1.5 pl-[13px] pr-8 text-[12px] font-bold text-[var(--studio-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/25"
      aria-label="Changer de page"
      @change="onSelect"
    >
      <option v-for="page in pages" :key="page.id" :value="pageLink(page)">
        {{ page.icon ? `${page.icon} ` : '' }}{{ page.title }}
      </option>
    </select>
    <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[var(--studio-muted)]">▼</span>
  </div>

  <!-- Desktop : onglets -->
  <div class="hidden w-max max-w-full items-center gap-[3px] overflow-x-auto rounded-full bg-[var(--studio-note)] p-[3px] lg:flex">
    <RouterLink
      v-for="page in pages"
      :key="page.id"
      :to="pageLink(page)"
      class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-[13px] py-1.5 text-[12px] font-bold transition-colors"
      :class="activePageId === page.id
        ? 'bg-white text-[var(--studio-ink)] shadow-sm'
        : 'text-[var(--studio-muted)] hover:text-[var(--studio-ink)]'"
    >
      <span v-if="page.icon" class="leading-none">{{ page.icon }}</span>{{ page.title }}
    </RouterLink>
  </div>
</template>

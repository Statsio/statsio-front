<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import { CONTENT_TYPE_META, publicContentPath } from '@/lib/content-display'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()
const studio = useStudioStore()
const route = useRoute()

const mode = computed(() => props.block.config.linkMode ?? 'url')

const title       = computed(() => props.block.config.linkTitle ?? '')
const description = computed(() => props.block.config.linkDescription ?? '')
const image       = computed(() => props.block.config.linkImage ?? '')

// Slug du document courant (route publique ou store en édition).
const docSlug = computed(() => String(route.params.slug ?? studio.content?.slug ?? ''))

const targetPage = computed(() =>
  mode.value === 'page'
    ? studio.pages.find((p) => p.id === props.block.config.linkPageId)
    : undefined,
)

const href = computed(() => {
  if (mode.value === 'content') {
    const t = props.block.config.linkContentType
    const s = props.block.config.linkContentSlug
    return t && s ? publicContentPath(t, s) : ''
  }
  if (mode.value === 'page') {
    if (!docSlug.value || !targetPage.value) return ''
    return `/statsdata/${docSlug.value}/${targetPage.value.slug ?? targetPage.value.id}`
  }
  return props.block.config.linkUrl ?? ''
})

const isExternal = computed(() => mode.value === 'url')

// Bandeau (eyebrow) au-dessus du titre.
const eyebrow = computed(() => {
  if (mode.value === 'content') {
    return CONTENT_TYPE_META[props.block.config.linkContentType ?? 'statsdata']?.label ?? ''
  }
  if (mode.value === 'page') return 'Sur cette page'
  return props.block.config.linkDomain ?? ''
})

const displayTitle = computed(
  () => title.value || (mode.value === 'page' ? targetPage.value?.title ?? '' : ''),
)

const isEmpty = computed(() => !href.value && !displayTitle.value)

const isLink = computed(() => !!href.value && !!props.readonly)
</script>

<template>
  <!-- Empty state -->
  <div
    v-if="isEmpty"
    class="flex flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-[var(--studio-line)] bg-[var(--studio-note)] py-10 text-[var(--studio-faint)]"
  >
    <svg class="w-7 h-7 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
    <span class="text-xs font-medium">Ajouter un lien →</span>
  </div>

  <!-- Link card -->
  <component
    :is="isLink ? 'a' : 'div'"
    v-else
    :href="isLink ? href : undefined"
    :target="isLink && isExternal ? '_blank' : undefined"
    :rel="isLink && isExternal ? 'noopener noreferrer' : undefined"
    class="group flex gap-4 overflow-hidden rounded-[14px] border border-[var(--studio-line)] bg-white p-4 shadow-sm transition-all duration-200 hover:border-[var(--studio-line-strong)] hover:shadow-md"
    :class="{ 'cursor-pointer': isLink }"
  >
    <!-- Thumbnail -->
    <img
      v-if="image"
      :src="image"
      alt=""
      class="h-16 w-24 shrink-0 rounded-lg object-cover"
      loading="lazy"
    />

    <!-- Content -->
    <div class="min-w-0 flex flex-col gap-0.5">
      <span v-if="eyebrow" class="text-[10px] font-semibold uppercase tracking-wider text-[var(--studio-faint)]">{{ eyebrow }}</span>
      <p v-if="displayTitle" class="font-semibold text-[var(--studio-ink)] leading-snug line-clamp-2">{{ displayTitle }}</p>
      <p v-if="description" class="text-sm text-[var(--studio-muted)] line-clamp-2">{{ description }}</p>
      <span v-if="href && !readonly" class="mt-1 text-[11px] text-[var(--color-primary)] truncate">{{ href }}</span>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

const url         = computed(() => props.block.config.linkUrl ?? '')
const title       = computed(() => props.block.config.linkTitle ?? '')
const description = computed(() => props.block.config.linkDescription ?? '')
const image       = computed(() => props.block.config.linkImage ?? '')
const domain      = computed(() => props.block.config.linkDomain ?? '')

const isEmpty = computed(() => !url.value && !title.value)
</script>

<template>
  <!-- Empty state -->
  <div
    v-if="isEmpty"
    class="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 text-slate-400"
  >
    <svg class="w-7 h-7 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
    <span class="text-xs font-medium">Ajouter un lien →</span>
  </div>

  <!-- Link card -->
  <component
    :is="url && readonly ? 'a' : 'div'"
    v-else
    :href="url && readonly ? url : undefined"
    :target="url && readonly ? '_blank' : undefined"
    :rel="url && readonly ? 'noopener noreferrer' : undefined"
    class="group flex gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
    :class="{ 'cursor-pointer': url && readonly }"
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
      <span v-if="domain" class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{{ domain }}</span>
      <p v-if="title" class="font-semibold text-slate-900 leading-snug line-clamp-2">{{ title }}</p>
      <p v-if="description" class="text-sm text-slate-500 line-clamp-2">{{ description }}</p>
      <span v-if="url && !readonly" class="mt-1 text-[11px] text-[var(--color-primary)] truncate">{{ url }}</span>
    </div>
  </component>
</template>

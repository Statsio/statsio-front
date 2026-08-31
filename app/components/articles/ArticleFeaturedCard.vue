<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem } from '@/types/catalog'
import { CATALOG_FORMAT_STYLE } from '@/lib/catalog-theme'
import { formatReadingTime } from '@/lib/catalog-format'
import { publicContentPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { channelPatternStyle } from '@/lib/channel-brand'

const props = defineProps<{
  item: CatalogItem
}>()

const basePath = useContentBasePath()
const to = computed(() => publicContentPath('article', props.item.slug, basePath.value))
const formatMeta = computed(() =>
  props.item.format ? CATALOG_FORMAT_STYLE[props.item.format] : null,
)
const coverStyle = computed(() => channelPatternStyle('#8b5cf6'))
</script>

<template>
  <NuxtLink
    :to="to"
    class="mb-[22px] grid overflow-hidden rounded-[22px] border-[1.5px] border-slate-200/80 bg-white text-slate-950 shadow-[0_1px_3px_rgba(20,20,30,0.06)] transition hover:border-[#c4b5fd] lg:grid-cols-2"
  >
    <span class="block px-8 py-8 lg:px-8 lg:py-9">
      <span class="mb-4 flex flex-wrap items-center gap-2.5">
        <span class="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-white bg-slate-950 rounded-[5px] px-2 py-1">À LA UNE</span>
        <span v-if="formatMeta" class="font-mono text-[10px] font-semibold tracking-[0.08em] text-accent">
          {{ formatMeta.label }} · {{ item.reading_minutes }} MIN DE LECTURE
        </span>
        <span v-else class="font-mono text-[10px] font-semibold tracking-[0.08em] text-accent">
          {{ formatReadingTime(item.reading_minutes).toUpperCase() }}
        </span>
      </span>
      <span class="block text-[1.7rem] font-extrabold leading-[1.14] tracking-[-0.025em] text-pretty lg:text-[31px]">
        {{ item.title }}
      </span>
      <span v-if="item.description" class="mt-3.5 block max-w-[52ch] text-[15px] leading-[1.62] text-slate-500">
        {{ item.description }}
      </span>
      <span class="mt-6 flex items-center gap-2.5">
        <span
          class="flex h-[38px] w-[38px] shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-[linear-gradient(135deg,#8b5cf6,#3b82f6)] text-xs font-extrabold text-white"
        >
          <img v-if="item.publisher.logo_url" :src="item.publisher.logo_url" :alt="item.publisher.name" class="h-full w-full object-cover" />
          <span v-else>{{ item.publisher.initials }}</span>
        </span>
        <span>
          <span class="flex items-center gap-1 text-[13px] font-bold">
            {{ item.publisher.name }}
            <span v-if="item.publisher.verified" class="text-[10px] text-accent">✔</span>
          </span>
          <span class="mt-0.5 block font-mono text-[10.5px] text-slate-400">
            {{ item.publisher.is_channel ? 'Chaîne' : 'Auteur' }} · {{ formatReadingTime(item.reading_minutes) }}
          </span>
        </span>
      </span>
      <span class="mt-6 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] px-[22px] py-3 text-[13px] font-extrabold tracking-[0.03em] text-white">
        LIRE L’ARTICLE →
      </span>
    </span>
    <span class="relative min-h-[220px] lg:min-h-[340px]" :style="item.thumbnail_url ? undefined : coverStyle">
      <img v-if="item.thumbnail_url" :src="item.thumbnail_url" :alt="item.title" class="absolute inset-0 h-full w-full object-cover" />
      <span class="absolute bottom-5 left-5 flex flex-wrap gap-1.5">
        <span v-if="item.linked_datasets_count" class="rounded-md bg-white px-2.5 py-1.5 font-mono text-[10px] font-semibold text-primary">
          {{ item.linked_datasets_count }} STATSDATA LIÉ{{ item.linked_datasets_count > 1 ? 'S' : '' }}
        </span>
        <span v-if="item.charts_count" class="rounded-md bg-white px-2.5 py-1.5 font-mono text-[10px] font-semibold text-slate-500">
          {{ item.charts_count }} GRAPHIQUE{{ item.charts_count > 1 ? 'S' : '' }}
        </span>
      </span>
    </span>
  </NuxtLink>
</template>

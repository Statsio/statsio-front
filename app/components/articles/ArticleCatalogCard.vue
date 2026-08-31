<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem } from '@/types/catalog'
import { CATALOG_FORMAT_STYLE, catalogThemeStyle } from '@/lib/catalog-theme'
import { formatCatalogItemMeta, formatReadingTime } from '@/lib/catalog-format'
import { publicContentPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { channelPatternStyle } from '@/lib/channel-brand'
import CatalogFavButton from '@/components/listing/CatalogFavButton.vue'
import CatalogPublisherRow from '@/components/listing/CatalogPublisherRow.vue'

const props = defineProps<{
  item: CatalogItem
  favorited: boolean
}>()

const emit = defineEmits<{
  favorite: []
  'select-tag': [string]
}>()

const basePath = useContentBasePath()
const to = computed(() => publicContentPath('article', props.item.slug, basePath.value))
const theme = computed(() => catalogThemeStyle(props.item.category))
const formatMeta = computed(() => (props.item.format ? CATALOG_FORMAT_STYLE[props.item.format] : null))
const coverStyle = computed(() => channelPatternStyle(theme.value.dot))
</script>

<template>
  <article class="flex flex-col overflow-hidden rounded-[18px] border-[1.5px] border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(20,20,30,0.06)] transition hover:-translate-y-0.5 hover:border-[#c4b5fd]">
    <div class="relative h-[150px]" :style="item.thumbnail_url ? undefined : coverStyle">
      <img v-if="item.thumbnail_url" :src="item.thumbnail_url" :alt="item.title" class="h-full w-full object-cover" />
      <span
        v-if="item.category"
        class="absolute left-3 top-3 rounded-[5px] bg-white px-2 py-1 font-mono text-[9.5px] font-semibold tracking-[0.08em]"
        :style="{ color: theme.fg }"
      >
        {{ item.category.toUpperCase() }}
      </span>
      <CatalogFavButton class="absolute right-2.5 top-2.5" :active="favorited" @toggle="emit('favorite')" />
    </div>

    <div class="flex flex-1 flex-col px-5 pb-5 pt-[18px]">
      <div class="mb-2.5 flex flex-wrap items-center gap-2">
        <span
          v-if="formatMeta"
          class="rounded-[5px] px-1.5 py-0.5 font-mono text-[9.5px] font-semibold tracking-[0.07em]"
          :style="{ color: formatMeta.fg, background: formatMeta.bg }"
        >
          {{ formatMeta.label }}
        </span>
        <span class="font-mono text-[10px] text-slate-400">{{ formatReadingTime(item.reading_minutes) }}</span>
        <span
          v-if="item.linked_datasets_count"
          class="rounded-[5px] bg-[#f2ecfd] px-1.5 py-0.5 font-mono text-[9.5px] font-semibold text-primary"
        >
          ▤ {{ item.linked_datasets_count }}
        </span>
      </div>

      <NuxtLink :to="to" class="block text-[17.5px] font-extrabold leading-snug tracking-[-0.015em] text-slate-950 text-pretty hover:text-primary">
        {{ item.title }}
      </NuxtLink>
      <p v-if="item.description" class="mt-2 text-[13px] leading-relaxed text-slate-500">{{ item.description }}</p>

      <div v-if="item.tags.length" class="mt-3.5 flex flex-wrap gap-1.5">
        <button
          v-for="tag in item.tags"
          :key="tag"
          type="button"
          class="rounded-md bg-[#f4f3f8] px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-[#f2ecfd] hover:text-primary"
          @click="emit('select-tag', tag)"
        >
          #{{ tag }}
        </button>
      </div>

      <CatalogPublisherRow class="mt-auto" :publisher="item.publisher" :meta="formatCatalogItemMeta(item.views_count, item.updated_at)" :to="to" />
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem } from '@/types/catalog'
import { catalogThemeStyle } from '@/lib/catalog-theme'
import { formatCatalogViews } from '@/lib/catalog-format'
import { publicContentPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { channelPatternStyle } from '@/lib/channel-brand'
import { seededSparklinePoints, getStatsDataVisual } from '@/utils/statsDataVisuals'
import CatalogFavButton from '@/components/listing/CatalogFavButton.vue'
import AppSparkline from '@/components/ui/AppSparkline.vue'

const props = defineProps<{
  item: CatalogItem
  favorited: boolean
}>()

const emit = defineEmits<{
  favorite: []
}>()

const basePath = useContentBasePath()
const to = computed(() => publicContentPath('statsdata', props.item.slug, basePath.value))
const theme = computed(() => catalogThemeStyle(props.item.category))
const thumbStyle = computed(() => channelPatternStyle(theme.value.dot))
const visual = computed(() => getStatsDataVisual(props.item.categories))
const sparklinePoints = computed(() => seededSparklinePoints(props.item.id, 7))
</script>

<template>
  <div class="grid grid-cols-[minmax(0,2.4fr)_1.3fr_1fr_0.8fr_0.7fr_46px] items-center gap-3.5 border-b border-slate-100 px-5 py-3.5 last:border-b-0 hover:bg-[#faf8ff]">
    <div class="flex min-w-0 items-center gap-3">
      <span class="h-[34px] w-11 shrink-0 rounded-[7px]" :style="item.thumbnail_url ? undefined : thumbStyle">
        <img v-if="item.thumbnail_url" :src="item.thumbnail_url" :alt="item.title" class="h-full w-full rounded-[7px] object-cover" />
      </span>
      <span class="min-w-0">
        <NuxtLink :to="to" class="block truncate text-sm font-bold text-slate-950 hover:text-primary">{{ item.title }}</NuxtLink>
        <span class="mt-0.5 block truncate font-mono text-[10px] text-slate-400">{{ formatCatalogViews(item.views_count) }}</span>
      </span>
    </div>
    <div>
      <AppSparkline :points="sparklinePoints" :color="visual.color" :height="22" />
    </div>
    <div class="truncate font-mono text-[10px] font-semibold tracking-[0.06em]" :style="{ color: theme.fg }">
      {{ item.category ?? '—' }}
    </div>
    <div class="min-w-0 truncate text-[12.5px] font-semibold text-slate-600">{{ item.publisher.name }}</div>
    <div class="text-right font-mono text-xs font-semibold text-slate-950">
      {{ item.linked_datasets_count || '—' }}
      <span class="ml-1 font-normal text-slate-400">src</span>
    </div>
    <div class="flex justify-end">
      <CatalogFavButton compact :active="favorited" @toggle="emit('favorite')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem } from '@/types/catalog'
import type { ContentCardFormat, ContentCardMode, ContentCardTone, ContentManageMeta } from '@/types/content-card'
import { CATALOG_FORMAT_STYLE, catalogThemeStyle } from '@/lib/catalog-theme'
import { formatCatalogItemMeta, formatCatalogViews, formatReadingTime } from '@/lib/catalog-format'
import { publicContentPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { channelPatternStyle } from '@/lib/channel-brand'
import ContentCardFavButton from '@/components/content/ContentCardFavButton.vue'
import ContentCardOwner from '@/components/content/ContentCardOwner.vue'
import ContentCardActions from '@/components/content/ContentCardActions.vue'
import CatalogSubBrandTag from '@/components/listing/CatalogSubBrandTag.vue'

const props = withDefaults(
  defineProps<{
    item: CatalogItem
    format?: ContentCardFormat
    mode?: ContentCardMode
    favorited?: boolean
    manage?: ContentManageMeta
    tone?: ContentCardTone
    feature?: boolean
    basePath?: string
  }>(),
  { format: 'card', mode: 'public', favorited: false, feature: false, tone: 'light' },
)

const emit = defineEmits<{
  favorite: []
  'select-tag': [string]
  edit: []
  remove: [string]
}>()

const injectedBase = useContentBasePath()
const base = computed(() => props.basePath ?? injectedBase.value)
const to = computed(() => publicContentPath('article', props.item.slug, base.value))
const theme = computed(() => catalogThemeStyle(props.item.category))
const formatMeta = computed(() => (props.item.format ? CATALOG_FORMAT_STYLE[props.item.format] : null))
const coverStyle = computed(() => channelPatternStyle(theme.value.dot))
const isManage = computed(() => props.mode === 'manage' && !!props.manage)
const pubMeta = computed(() => formatCatalogItemMeta(props.item.views_count, props.item.updated_at))
</script>

<template>
  <NuxtLink
    v-if="feature"
    :to="to"
    class="grid overflow-hidden rounded-[22px] border-[1.5px] border-slate-200/80 bg-white text-slate-950 shadow-[0_1px_3px_rgba(20,20,30,0.06)] transition hover:border-[#c4b5fd] lg:grid-cols-2"
  >
    <span class="block px-8 py-8 lg:px-8 lg:py-9">
      <span class="mb-4 flex flex-wrap items-center gap-2.5">
        <span class="rounded-[5px] bg-slate-950 px-2 py-1 font-mono text-[9.5px] font-semibold tracking-[0.1em] text-white">À LA UNE</span>
        <span v-if="formatMeta" class="font-mono text-[10px] font-semibold tracking-[0.08em] text-accent">
          {{ formatMeta.label }} · {{ item.reading_minutes }} MIN DE LECTURE
        </span>
        <span v-else class="font-mono text-[10px] font-semibold tracking-[0.08em] text-accent">
          {{ formatReadingTime(item.reading_minutes).toUpperCase() }}
        </span>
      </span>
      <span class="block text-[1.7rem] font-extrabold leading-[1.14] tracking-[-0.025em] text-pretty lg:text-[31px]">{{ item.title }}</span>
      <span v-if="item.description" class="mt-3.5 block max-w-[52ch] text-[15px] leading-[1.62] text-slate-500">{{ item.description }}</span>
      <span class="mt-6 flex items-center gap-2.5">
        <span class="flex h-[38px] w-[38px] shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-[linear-gradient(135deg,#8b5cf6,#3b82f6)] text-xs font-extrabold text-white">
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

  <div
    v-else-if="format === 'row'"
    class="grid grid-cols-[minmax(0,2.6fr)_0.9fr_1.1fr_0.7fr_0.6fr_46px] items-center gap-3.5 border-b border-slate-100 px-5 py-3.5 last:border-b-0 hover:bg-[#faf8ff]"
  >
    <div class="flex min-w-0 items-center gap-3">
      <span class="h-[34px] w-11 shrink-0 rounded-[7px]" :style="item.thumbnail_url ? undefined : channelPatternStyle(theme.dot)">
        <img v-if="item.thumbnail_url" :src="item.thumbnail_url" :alt="item.title" class="h-full w-full rounded-[7px] object-cover" />
      </span>
      <span class="min-w-0">
        <NuxtLink :to="isManage && manage ? manage.studioPath : to" class="block truncate text-sm font-bold text-slate-950 hover:text-primary">{{ item.title }}</NuxtLink>
        <span class="mt-0.5 block truncate font-mono text-[10px] text-slate-400">{{ formatCatalogViews(item.views_count) }}</span>
      </span>
    </div>
    <div class="truncate font-mono text-[10px] font-semibold tracking-[0.06em]" :style="{ color: theme.fg }">
      {{ item.category ?? '—' }}
    </div>
    <div class="min-w-0 truncate text-[12.5px] font-semibold text-slate-600">{{ isManage && manage ? manage.ownerLabel : item.publisher.name }}</div>
    <div class="text-right font-mono text-[11.5px] text-slate-500">{{ formatReadingTime(item.reading_minutes) }}</div>
    <div class="text-right font-mono text-xs font-semibold text-slate-950">{{ formatCatalogViews(item.views_count).replace(' vues', '') }}</div>
    <div class="flex justify-end">
      <ContentCardFavButton v-if="!isManage" compact :active="favorited" @toggle="emit('favorite')" />
      <span
        v-else-if="manage"
        class="rounded-full px-2 py-0.5 text-[9.5px] font-bold"
        :style="{ background: manage.statusBg, color: manage.statusColor }"
      >{{ manage.statusLabel }}</span>
    </div>
  </div>

  <article
    v-else
    class="flex flex-col overflow-hidden rounded-[18px] border-[1.5px] border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(20,20,30,0.06)] transition hover:-translate-y-0.5 hover:border-[#c4b5fd]"
  >
    <div class="relative h-[150px]" :style="item.thumbnail_url ? undefined : coverStyle">
      <img v-if="item.thumbnail_url" :src="item.thumbnail_url" :alt="item.title" class="h-full w-full object-cover" />
      <span
        v-if="item.category"
        class="absolute left-3 top-3 rounded-[5px] bg-white px-2 py-1 font-mono text-[9.5px] font-semibold tracking-[0.08em]"
        :style="{ color: theme.fg }"
      >
        {{ item.category.toUpperCase() }}
      </span>
      <ContentCardFavButton v-if="!isManage" class="absolute right-2.5 top-2.5" :active="favorited" @toggle="emit('favorite')" />
      <span
        v-else-if="manage"
        class="absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
        :style="{ background: manage.statusBg, color: manage.statusColor }"
      >{{ manage.statusLabel }}</span>
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

      <CatalogSubBrandTag :categories="item.categories" content-type="article" />
      <NuxtLink
        :to="isManage && manage ? manage.studioPath : to"
        class="block text-[17.5px] font-extrabold leading-snug tracking-[-0.015em] text-slate-950 text-pretty hover:text-primary"
      >
        {{ item.title }}
      </NuxtLink>
      <p v-if="item.description" class="mt-2 text-[13px] leading-relaxed text-slate-500">{{ item.description }}</p>

      <div v-if="!isManage && item.tags.length" class="mt-3.5 flex flex-wrap gap-1.5">
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

      <slot name="cta" />

      <ContentCardActions v-if="isManage && manage" class="mt-auto" :manage="manage" />
      <ContentCardOwner v-else class="mt-auto" :publisher="item.publisher" :meta="pubMeta" :to="to" />
    </div>
  </article>
</template>

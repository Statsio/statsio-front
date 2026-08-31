<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem } from '@/types/catalog'
import { publicContentPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { surveyCardMeta } from '@/lib/survey-card'
import CatalogFavButton from '@/components/listing/CatalogFavButton.vue'

const props = defineProps<{
  item: CatalogItem
  favorited: boolean
}>()

const emit = defineEmits<{
  favorite: []
}>()

const basePath = useContentBasePath()
const to = computed(() => publicContentPath('survey', props.item.slug, basePath.value))
const meta = computed(() => surveyCardMeta(props.item))

const leadLine = computed(() => {
  const it = props.item
  if (it.survey_kind === 'long') return `${it.questions_count ?? 0} questions · ≈ ${it.estimated_minutes ?? 1} min`
  if (it.survey_kind === 'petition') return meta.value.goalLabel || meta.value.participationLabel
  const top = meta.value.options[0]
  return top ? `${top.label} — ${top.pct} %` : meta.value.participationLabel
})
</script>

<template>
  <div class="grid grid-cols-[minmax(0,2.5fr)_1.05fr_1fr_0.8fr_0.8fr_46px] items-center gap-3.5 border-b border-slate-100 px-5 py-3.5 last:border-b-0 hover:bg-[#faf8ff]">
    <div class="flex min-w-0 items-center gap-3">
      <span
        class="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg text-[12px]"
        :style="{ background: meta.kind.bg, color: meta.kind.fg }"
      >{{ meta.kind.icon }}</span>
      <span class="min-w-0">
        <NuxtLink :to="to" class="block truncate text-sm font-bold text-slate-950 hover:text-primary">{{ item.title }}</NuxtLink>
        <span class="mt-0.5 block truncate font-mono text-[10px] text-slate-400">{{ leadLine }}</span>
      </span>
    </div>
    <div class="truncate font-mono text-[10px] font-semibold tracking-[0.06em]" :style="{ color: meta.kind.fg }">
      {{ meta.kind.label }}
    </div>
    <div class="min-w-0 truncate text-[12.5px] font-semibold text-slate-600">{{ item.publisher.name }}</div>
    <div class="text-right font-mono text-[12.5px] font-semibold text-slate-950">{{ meta.participationLabel }}</div>
    <div class="text-right font-mono text-[11.5px]" :style="{ color: meta.timeFg }">{{ meta.timeLabel }}</div>
    <div class="flex justify-end">
      <CatalogFavButton compact :active="favorited" @toggle="emit('favorite')" />
    </div>
  </div>
</template>

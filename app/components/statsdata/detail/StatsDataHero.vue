<script setup lang="ts">
import { computed } from 'vue'
import { formatRowCount } from '@/utils/statsDataFormat'
import { primaryFreshness } from '@/lib/statsdata-freshness'
import type { ContentDataset, StatsDataDocument } from '@/api/studio'
import StatsDataActionButton from './StatsDataActionButton.vue'
import StatsDataPublisherCard from './StatsDataPublisherCard.vue'

const props = defineProps<{
  doc: StatsDataDocument
  title: string
  isFavorite: boolean
  isFollowing: boolean
  canFollow: boolean
  /** Ancre de la 1re section contenant un bloc recherche, pour le CTA « chercher ma commune ». */
  searchAnchor?: string | null
}>()

defineEmits<{ 'toggle-favorite': []; 'toggle-follow': [] }>()

const category = computed(() => props.doc.categories?.[0] ?? null)

const datasets = computed<ContentDataset[]>(() => props.doc.datasets ?? [])
const freshness = computed(() => primaryFreshness(datasets.value))

const COVERAGE_LABEL: Record<string, string> = {
  mondiale: 'Mondiale',
  continentale: 'Continentale',
  nationale: 'Nationale',
  regionale: 'Régionale',
  locale: 'Locale',
}

const meta = computed(() => {
  const items: { label: string; value: string }[] = []
  if (props.doc.coverage) items.push({ label: 'Couverture', value: COVERAGE_LABEL[props.doc.coverage] ?? props.doc.coverage })
  const rows = datasets.value.reduce((sum, d) => sum + (d.row_count ?? 0), 0)
  if (rows) items.push({ label: 'Volume', value: formatRowCount(rows) ?? '—' })
  if (datasets.value.length) items.push({ label: 'Sources', value: String(datasets.value.length) })
  if (props.doc.views_count) items.push({ label: 'Consultations', value: new Intl.NumberFormat('fr-FR').format(props.doc.views_count) })
  return items
})
</script>

<template>
  <section class="border-b border-[var(--studio-line)] bg-white">
    <div class="mx-auto grid max-w-[1180px] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_306px] lg:gap-[46px] lg:py-11">
      <div class="min-w-0">
        <div class="mb-4 flex flex-wrap items-center gap-2.5">
          <span v-if="category" class="mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--studio-faint)]">{{ category }}</span>
          <span v-if="category && freshness" class="h-[3px] w-[3px] rounded-full bg-[var(--studio-faint)]" />
          <span v-if="freshness" class="mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--studio-faint)]">
            {{ freshness.tone === 'live' ? 'Données en direct' : freshness.text }}
          </span>
        </div>

        <h1 class="max-w-[19ch] text-[34px] font-extrabold leading-[1.06] tracking-[-0.025em] [text-wrap:pretty] text-[var(--studio-ink)] sm:text-[42px] lg:text-[47px]">
          {{ title }}
        </h1>
        <p v-if="doc.description" class="mt-5 max-w-[56ch] text-[16px] leading-[1.6] text-[var(--studio-muted)] [text-wrap:pretty] sm:text-[17.5px]">
          {{ doc.description }}
        </p>

        <div v-if="meta.length" class="mt-6 flex flex-wrap gap-x-7 gap-y-4 border-t border-[var(--studio-line)] pt-5">
          <div v-for="m in meta" :key="m.label">
            <div class="text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-[var(--studio-faint)]">{{ m.label }}</div>
            <div class="mono mt-1 text-[13.5px] font-semibold text-[var(--studio-ink)]">{{ m.value }}</div>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap gap-2.5">
          <StatsDataActionButton
            v-if="!doc.can_edit"
            variant="toggle"
            :active="isFavorite"
            @click="$emit('toggle-favorite')"
          >
            <span>{{ isFavorite ? '★' : '☆' }}</span>
            <span>{{ isFavorite ? 'En favori' : 'Favori' }}</span>
          </StatsDataActionButton>
          <StatsDataActionButton v-if="searchAnchor" variant="gradient" as="a" :href="`#${searchAnchor}`">
            Chercher ma commune
          </StatsDataActionButton>
        </div>
      </div>

      <StatsDataPublisherCard
        :doc="doc"
        :is-following="isFollowing"
        :can-follow="canFollow"
        @toggle-follow="$emit('toggle-follow')"
      />
    </div>
  </section>
</template>

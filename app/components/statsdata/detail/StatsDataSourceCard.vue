<script setup lang="ts">
import { ref } from 'vue'
import { formatRowCount } from '@/utils/statsDataFormat'
import { downloadPublicDatasetParquet, type ContentDataset } from '@/api/studio'
import StatsDataFreshnessBadge from './StatsDataFreshnessBadge.vue'

const props = withDefaults(
  defineProps<{
    datasets: ContentDataset[]
    docSlug: string
    hideHeading?: boolean
  }>(),
  { hideHeading: false },
)

defineEmits<{ reuse: [dataset: ContentDataset] }>()

const downloadingId = ref<string | null>(null)
const downloadErrorById = ref<Record<string, string>>({})

async function downloadParquet(dataset: ContentDataset) {
  if (downloadingId.value) return
  downloadingId.value = dataset.id
  const next = { ...downloadErrorById.value }
  delete next[dataset.id]
  downloadErrorById.value = next
  try {
    await downloadPublicDatasetParquet(props.docSlug, dataset)
  } catch (err) {
    downloadErrorById.value = {
      ...downloadErrorById.value,
      [dataset.id]: err instanceof Error ? err.message : 'Téléchargement impossible.',
    }
  } finally {
    downloadingId.value = null
  }
}
</script>

<template>
  <aside v-if="datasets.length > 0" class="rounded-2xl border border-[var(--studio-line-strong)] bg-white px-4 py-4">
    <p
      v-if="!hideHeading"
      class="mb-3 text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-[var(--studio-faint)]"
    >
      Sources de données
    </p>
    <div class="flex flex-col gap-4">
      <div
        v-for="dataset in datasets"
        :key="dataset.id"
        class="flex flex-col gap-1.5 border-t border-[var(--studio-line)] pt-3.5 first:border-t-0 first:pt-0"
      >
        <span class="truncate text-[13px] font-semibold text-[var(--studio-ink)]" :title="dataset.name">
          {{ dataset.name }}
        </span>

        <div class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-[var(--studio-faint)]">
          <span v-if="dataset.provenance" class="truncate" :title="dataset.provenance">{{ dataset.provenance }}</span>
          <span v-if="dataset.provenance && formatRowCount(dataset.row_count)" aria-hidden="true">·</span>
          <span v-if="formatRowCount(dataset.row_count)" class="mono shrink-0">{{ formatRowCount(dataset.row_count) }}</span>
        </div>

        <StatsDataFreshnessBadge :dataset="dataset" compact />

        <div class="mt-0.5 flex flex-col items-start gap-1">
          <button
            v-if="dataset.downloadable"
            type="button"
            class="text-left text-[12px] font-semibold text-[var(--studio-ink)] transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 disabled:opacity-50"
            :disabled="downloadingId === dataset.id"
            @click="downloadParquet(dataset)"
          >
            {{ downloadingId === dataset.id ? 'Téléchargement…' : '↓ Télécharger le parquet' }}
          </button>
          <button
            type="button"
            class="text-left text-[12px] font-semibold text-[var(--color-primary)] transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
            @click="$emit('reuse', dataset)"
          >
            Réutiliser la source
          </button>
          <p
            v-if="downloadErrorById[dataset.id]"
            class="text-[11px] text-rose-600"
          >
            {{ downloadErrorById[dataset.id] }}
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>

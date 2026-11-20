<script setup lang="ts">
import { ref } from 'vue'
import { formatRowCount } from '@/utils/statsDataFormat'
import { downloadPublicDatasetParquet, type ContentDataset } from '@/api/studio'
import { freshnessLabel } from '@/lib/statsdata-freshness'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsMeta from '@/components/ds/DsMeta.vue'

const props = withDefaults(
  defineProps<{
    datasets: ContentDataset[]
    docSlug: string
    hideHeading?: boolean
    /** Dans une modale : pas de cadre Bold Outline (la modale en porte un). */
    bare?: boolean
  }>(),
  { hideHeading: false, bare: false },
)

defineEmits<{ reuse: [dataset: ContentDataset] }>()

const downloadingId = ref<string | null>(null)
const downloadErrorById = ref<Record<string, string>>({})

function fresh(dataset: ContentDataset) {
  const f = freshnessLabel(dataset)
  return f && f.tone !== 'unknown' ? f : null
}

function metaLine(dataset: ContentDataset): string {
  return [dataset.provenance, formatRowCount(dataset.row_count)].filter(Boolean).join(' · ')
}

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
  <aside v-if="datasets.length > 0" class="sdsrc" :class="{ 'is-bare': bare }">
    <DsLabel v-if="!hideHeading" as="p">Sources de données</DsLabel>
    <div v-for="dataset in datasets" :key="dataset.id" class="sdsrc__item">
      <b :title="dataset.name">{{ dataset.name }}</b>
      <DsMeta v-if="metaLine(dataset)">{{ metaLine(dataset) }}</DsMeta>
      <span
        v-if="fresh(dataset)"
        class="sdsrc__fresh"
        :class="`is-${fresh(dataset)!.tone}`"
        :title="fresh(dataset)!.detail"
      >{{ fresh(dataset)!.text }}</span>
      <span class="sdsrc__links">
        <button
          v-if="dataset.downloadable"
          type="button"
          :disabled="downloadingId === dataset.id"
          @click="downloadParquet(dataset)"
        >
          {{ downloadingId === dataset.id ? 'Téléchargement…' : '↓ Parquet' }}
        </button>
        <button type="button" @click="$emit('reuse', dataset)">Réutiliser</button>
      </span>
      <p v-if="downloadErrorById[dataset.id]" class="sdsrc__err">{{ downloadErrorById[dataset.id] }}</p>
    </div>
  </aside>
</template>

<style scoped>
.sdsrc {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border: 2px solid var(--ds-ol);
  border-radius: 6px;
  background: var(--ds-surface);
  box-shadow: 5px 5px 0 var(--ds-sh);
}
.sdsrc.is-bare {
  padding: 0;
  border: 0;
  box-shadow: none;
}
.sdsrc__item {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  padding: 12px 0;
  border-bottom: 2px solid var(--ds-line);
}
.sdsrc__item:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}
.sdsrc.is-bare .sdsrc__item:first-child {
  padding-top: 0;
}
.sdsrc__item b {
  overflow: hidden;
  color: var(--ds-text);
  font: 700 14px/1.35 var(--ds-ui);
  text-overflow: ellipsis;
}
.sdsrc__fresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ds-faint);
  font: 500 11px/1.3 var(--ds-num);
}
.sdsrc__fresh::before {
  content: '';
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 100% 0 0 0;
  background: currentColor;
}
.sdsrc__fresh.is-live,
.sdsrc__fresh.is-fresh {
  color: var(--ds-ok);
}
.sdsrc__fresh.is-stale {
  color: #b45309;
}
.sdsrc__links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
}
.sdsrc__links button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--ds-link);
  font: 700 13px/1.3 var(--ds-ui);
  cursor: pointer;
}
.sdsrc__links button:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.sdsrc__links button:disabled {
  opacity: 0.5;
}
.sdsrc__err {
  color: #be123c;
  font: 400 11.5px/1.4 var(--ds-ui);
}
</style>

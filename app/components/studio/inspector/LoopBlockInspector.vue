<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { fetchDistinctValues } from '@/api/studio'
import { blockSourceParams } from '@/composables/useBlockData'
import type { BlockFilter, DatasetMeta, StudioBlock } from '@/types/studio'
import FieldPicker from '@/components/studio/fields/FieldPicker.vue'
import FieldNote from '@/components/studio/fields/FieldNote.vue'
import DataSourceWizard from '@/components/studio/ui/DataSourceWizard.vue'
import ColumnPickerModal from '@/components/studio/ui/ColumnPickerModal.vue'
import FiltersModal from '@/components/studio/ui/FiltersModal.vue'

const props = defineProps<{ block: StudioBlock; activeTab: string }>()
const studio = useStudioStore()
const datasets = useStudioDatasetsStore()

const block = computed(() => props.block)

function updateMapping(key: string, value: string) {
  studio.updateBlockFieldMapping(props.block.id, { [key]: value })
}
function updateConfig(key: string, value: unknown) {
  studio.updateBlockConfig(props.block.id, { [key]: value })
}

watch(() => props.block.datasetId, (id) => { if (id) datasets.loadSchema(id) }, { immediate: true })

const datasetName = computed(() =>
  props.block.datasetId
    ? (datasets.readyDatasets.find((d: DatasetMeta) => d.id === props.block.datasetId)?.name ?? 'Source sélectionnée')
    : 'Aucune source',
)
const loopColumn = computed(() => props.block.fieldMapping.loopColumn ?? '')
const loopVar = computed(() => props.block.fieldMapping.loopVar || 'item')
const filters = computed<BlockFilter[]>(() => props.block.filters ?? [])

// ─── Aperçu des valeurs ──────────────────────────────────────────────────────
const preview = ref<string[]>([])
const previewLoading = ref(false)

watch(
  () => [props.block.datasetId, JSON.stringify(props.block.sources ?? []), JSON.stringify(props.block.joins ?? []), loopColumn.value, JSON.stringify(filters.value)].join('|'),
  async () => {
    preview.value = []
    const sp = blockSourceParams(props.block)
    if (!sp.urlDatasetId || !loopColumn.value) return
    previewLoading.value = true
    try {
      preview.value = await fetchDistinctValues(
        sp.urlDatasetId,
        loopColumn.value,
        '',
        filters.value.filter((f) => f.column && f.value !== ''),
        { sources: sp.sources, primarySourceId: sp.primarySourceId, joins: sp.joins },
      )
    } catch {
      preview.value = []
    } finally {
      previewLoading.value = false
    }
  },
  { immediate: true },
)

// ─── Sub-modals ──────────────────────────────────────────────────────────────
const showDataSourceModal = ref(false)
const showColumnModal = ref(false)
const showFiltersModal = ref(false)

function onVarInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const clean = raw.replace(/[^\w]/g, '')
  updateMapping('loopVar', clean)
}

const LAYOUTS = [
  { v: '1-col', l: '1 colonne' },
  { v: '2-cols', l: '2 colonnes' },
  { v: '3-cols', l: '3 colonnes' },
] as const
</script>

<template>
  <div>
    <!-- ── Onglet Boucle ── -->
    <template v-if="activeTab === 'data'">
      <div class="flex flex-col gap-[11px] px-4 pb-1 pt-3">
        <FieldPicker
          label="Source"
          :value="datasetName"
          action="Changer"
          @open="showDataSourceModal = true"
        />
        <DataSourceWizard :show="showDataSourceModal" :block="block" @close="showDataSourceModal = false" />

        <template v-if="block.datasetId">
          <FieldPicker
            label="Colonne à parcourir"
            :value="loopColumn || 'Choisir une colonne'"
            :action="loopColumn ? 'Changer' : 'Choisir'"
            @open="showColumnModal = true"
          />
          <ColumnPickerModal
            :show="showColumnModal"
            :block="block"
            mode="single"
            :model-value="loopColumn || null"
            @update:model-value="updateMapping('loopColumn', $event)"
            @close="showColumnModal = false"
          />

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-[var(--studio-muted)]">Nom de la variable</label>
            <input
              type="text"
              class="cfg-input"
              :value="loopVar"
              placeholder="item"
              @input="onVarInput"
            />
            <p class="text-[11px] text-[var(--studio-faint)] leading-relaxed">
              Utilisez <code class="font-mono">{{ '{' + '{' + loopVar + '}' + '}' }}</code> dans les filtres,
              titres et textes des blocs placés dans la boucle pour insérer la valeur courante.
            </p>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-[var(--studio-muted)]">Nombre max d'itérations</label>
            <input
              type="number"
              min="1"
              max="50"
              class="cfg-input [appearance:textfield]"
              :value="block.config.loopLimit ?? 20"
              @input="updateConfig('loopLimit', Number(($event.target as HTMLInputElement).value) || 20)"
            />
          </div>

          <FieldNote v-if="previewLoading">Chargement des valeurs…</FieldNote>
          <FieldNote v-else-if="loopColumn && preview.length">
            {{ preview.length }} valeur{{ preview.length > 1 ? 's' : '' }} :
            {{ preview.slice(0, 8).join(', ') }}{{ preview.length > 8 ? '…' : '' }}
          </FieldNote>
          <FieldNote v-else-if="loopColumn">Aucune valeur trouvée pour cette colonne.</FieldNote>
        </template>
        <FieldNote v-else>Choisissez une source de données pour configurer la boucle.</FieldNote>
      </div>
    </template>

    <!-- ── Onglet Filtres ── -->
    <template v-if="activeTab === 'filters'">
      <div class="flex flex-col gap-[11px] px-4 pb-1 pt-3">
        <FieldNote v-if="!block.datasetId">Connectez d'abord une source dans l'onglet Boucle.</FieldNote>
        <template v-else>
          <FieldPicker
            label="Filtres sur les valeurs"
            :value="filters.length ? `${filters.length} filtre${filters.length > 1 ? 's' : ''}` : 'Aucun filtre'"
            :action="filters.length ? 'Modifier' : 'Ajouter'"
            @open="showFiltersModal = true"
          />
          <FiltersModal :show="showFiltersModal" :block="block" mode="primary" @close="showFiltersModal = false" />
          <FieldNote>Restreint les valeurs parcourues (ex. limiter à une région).</FieldNote>
        </template>
      </div>
    </template>

    <!-- ── Onglet Style ── -->
    <template v-if="activeTab === 'style'">
      <div class="flex flex-col gap-2 px-4 pb-1 pt-3">
        <label class="text-xs font-semibold text-[var(--studio-muted)]">Disposition des itérations</label>
        <div class="grid grid-cols-3 gap-1.5">
          <button
            v-for="o in LAYOUTS"
            :key="o.v"
            class="py-2.5 rounded-xl border text-[11px] font-semibold transition-colors"
            :class="(block.config.loopLayout ?? '1-col') === o.v ? 'cfg-active' : 'cfg-inactive'"
            @click="updateConfig('loopLayout', o.v)"
          >
            {{ o.l }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
@reference "tailwindcss";
.cfg-input {
  @apply w-full;
  box-sizing: border-box;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1.5px solid var(--studio-line-strong);
  font-size: 13px;
  color: var(--studio-ink);
  background: #fff;
}
.cfg-input:focus { outline: none; border-color: var(--color-primary); }
.cfg-active { border-color: var(--studio-ink); background: var(--studio-ink); color: #fff; }
.cfg-inactive { border-color: var(--studio-line-strong); color: color-mix(in srgb, var(--studio-ink) 70%, transparent); }
.cfg-inactive:hover { border-color: var(--color-primary); }
</style>

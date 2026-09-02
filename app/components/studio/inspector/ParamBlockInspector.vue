<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { fetchDistinctValues } from '@/api/studio'
import { blockSourceParams } from '@/composables/useBlockData'
import type { DatasetMeta, StudioBlock } from '@/types/studio'
import FieldPicker from '@/components/studio/fields/FieldPicker.vue'
import FieldNote from '@/components/studio/fields/FieldNote.vue'
import DataSourceWizard from '@/components/studio/ui/DataSourceWizard.vue'
import ColumnPickerModal from '@/components/studio/ui/ColumnPickerModal.vue'

const props = defineProps<{ block: StudioBlock }>()
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
const column = computed(() => props.block.fieldMapping.paramColumn ?? '')
const paramName = computed(() => props.block.fieldMapping.paramName || column.value)

// ─── Valeurs distinctes (aperçu + choix de la valeur par défaut) ──────────────
const values = ref<string[]>([])
const loadingValues = ref(false)

watch(
  () => [props.block.datasetId, JSON.stringify(props.block.sources ?? []), JSON.stringify(props.block.joins ?? []), column.value].join('|'),
  async () => {
    values.value = []
    const sp = blockSourceParams(props.block)
    if (!sp.urlDatasetId || !column.value) return
    loadingValues.value = true
    try {
      values.value = await fetchDistinctValues(sp.urlDatasetId, column.value, '', [], { sources: sp.sources, primarySourceId: sp.primarySourceId, joins: sp.joins })
    } catch {
      values.value = []
    } finally {
      loadingValues.value = false
    }
  },
  { immediate: true },
)

// ─── Déclaration du paramètre sur la page ────────────────────────────────────
// Le contrôle écrit `pageParams[nom]` au runtime ; on déclare aussi le paramètre
// sur la page pour qu'il soit réamorcé au chargement et listé dans « Paramètres ».
watch(
  () => [
    paramName.value, props.block.datasetId, column.value,
    props.block.config.paramDefault, props.block.config.paramFanOut,
  ].join('|'),
  () => {
    const name = paramName.value
    if (!name || !column.value) return
    const decl = {
      name,
      column: column.value,
      datasetId: props.block.datasetId,
      defaultValue: props.block.config.paramDefault || undefined,
      fanOut: props.block.config.paramFanOut === true || undefined,
      slugColumn: props.block.config.paramFanOut === true ? column.value : undefined,
    }
    if (studio.currentPageParamDefs.some((p) => p.name === name)) {
      studio.updatePageParam(studio.currentPageId, name, decl)
    } else {
      studio.addPageParam(studio.currentPageId, decl)
    }
  },
)

const showDataSourceModal = ref(false)
const showColumnModal = ref(false)

const CONTROLS = [
  { v: 'segmented', l: 'Pastilles' },
  { v: 'dropdown', l: 'Liste' },
] as const
</script>

<template>
  <div class="flex flex-col gap-[11px] px-4 pb-2 pt-3">
    <FieldPicker label="Source" :value="datasetName" action="Changer" @open="showDataSourceModal = true" />
    <DataSourceWizard :show="showDataSourceModal" :block="block" @close="showDataSourceModal = false" />

    <template v-if="block.datasetId">
      <FieldPicker
        label="Colonne pilote"
        :value="column || 'Choisir une colonne'"
        :action="column ? 'Changer' : 'Choisir'"
        @open="showColumnModal = true"
      />
      <ColumnPickerModal
        :show="showColumnModal"
        :block="block"
        mode="single"
        :model-value="column || null"
        @update:model-value="updateMapping('paramColumn', $event)"
        @close="showColumnModal = false"
      />

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-[var(--studio-muted)]">Nom du paramètre</label>
        <input
          type="text"
          class="cfg-input"
          :value="paramName"
          :placeholder="column || 'ex. carburant'"
          @input="updateMapping('paramName', (($event.target as HTMLInputElement).value).replace(/[^\w-]/g, ''))"
        />
        <p class="text-[11px] leading-relaxed text-[var(--studio-faint)]">
          Les autres blocs le réutilisent via
          <code class="font-mono">{{ '{' + '{' + (paramName || 'nom') + '}' + '}' }}</code>
          dans leurs filtres, titres et textes.
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-[var(--studio-muted)]">Libellé affiché</label>
        <input
          type="text"
          class="cfg-input"
          :value="block.config.title ?? ''"
          placeholder="ex. Carburant"
          @input="updateConfig('title', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-[var(--studio-muted)]">Style du contrôle</label>
        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="o in CONTROLS"
            :key="o.v"
            class="rounded-xl border py-2.5 text-[11px] font-semibold transition-colors"
            :class="(block.config.paramControl ?? 'segmented') === o.v ? 'cfg-active' : 'cfg-inactive'"
            @click="updateConfig('paramControl', o.v)"
          >{{ o.l }}</button>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-[var(--studio-muted)]">Valeur par défaut</label>
        <select
          class="cfg-input"
          :value="block.config.paramDefault ?? ''"
          @change="updateConfig('paramDefault', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Aucune (ou « {{ block.config.paramAllLabel || 'Tout' }} »)</option>
          <option v-for="v in values" :key="v" :value="v">{{ v }}</option>
        </select>
        <FieldNote v-if="loadingValues">Chargement des valeurs…</FieldNote>
        <FieldNote v-else-if="values.length">{{ values.length }} valeur{{ values.length > 1 ? 's' : '' }} détectée{{ values.length > 1 ? 's' : '' }}.</FieldNote>
      </div>

      <label class="toggle-row" @click="updateConfig('paramAllowAll', !block.config.paramAllowAll)">
        <span class="text-sm text-[var(--studio-ink)]">Proposer une option « toutes les valeurs »</span>
        <span class="toggle" :class="block.config.paramAllowAll ? 'toggle-on' : 'toggle-off'">
          <span class="toggle-knob" :class="block.config.paramAllowAll ? 'translate-x-3.5' : 'translate-x-0.5'" />
        </span>
      </label>

      <label class="toggle-row" @click="updateConfig('paramFanOut', !block.config.paramFanOut)">
        <span>
          <span class="text-sm text-[var(--studio-ink)]">Générer une page par valeur</span>
          <span class="mt-0.5 block text-[11px] leading-relaxed text-[var(--studio-faint)]">
            Publie une URL indexable <code class="font-mono">/…/{{ column || 'valeur' }}</code> pour chaque valeur (SEO).
          </span>
        </span>
        <span class="toggle shrink-0" :class="block.config.paramFanOut ? 'toggle-on' : 'toggle-off'">
          <span class="toggle-knob" :class="block.config.paramFanOut ? 'translate-x-3.5' : 'translate-x-0.5'" />
        </span>
      </label>
    </template>

    <FieldNote v-else>Choisissez une source de données pour configurer le paramètre.</FieldNote>
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
.toggle-row {
  @apply flex items-center justify-between px-3.5 py-3 cursor-pointer;
  border-radius: 12px;
  border: 1px solid var(--studio-line);
}
.toggle      { @apply w-8 h-5 rounded-full relative shrink-0 transition-colors; }
.toggle-on   { background: var(--color-primary); }
.toggle-off  { background: color-mix(in srgb, var(--studio-ink) 16%, transparent); }
.toggle-knob { @apply absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform; }
</style>

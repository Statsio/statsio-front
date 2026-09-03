<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { blockColumnGroups, primarySourceId } from '@/lib/studio-columns'
import type { DatasetMeta, StudioBlock } from '@/types/studio'
import { useSourceDrillIn } from '@/composables/useSourceDrillIn'
import FieldPicker from '@/components/studio/fields/FieldPicker.vue'
import FieldNote from '@/components/studio/fields/FieldNote.vue'
import FieldColumns from '@/components/studio/fields/FieldColumns.vue'
import BlockFiltersField from '@/components/studio/fields/BlockFiltersField.vue'

const props = defineProps<{ block: StudioBlock; activeTab: string }>()
const studio = useStudioStore()
const datasets = useStudioDatasetsStore()

const block = computed(() => props.block)
const isRelated = computed(() => props.block.type === 'related')

function updateConfig(key: string, value: unknown) { studio.updateBlockConfig(props.block.id, { [key]: value }) }
function updateMapping(key: string, value: unknown) { studio.updateBlockFieldMapping(props.block.id, { [key]: value }) }

watch(() => props.block.datasetId, (id) => { if (id) datasets.loadSchema(id) }, { immediate: true })

const columnGroups = computed(() => blockColumnGroups(props.block, datasets))
const primaryId = computed(() => primarySourceId(props.block))

/** Toutes les réfs disponibles — nue pour la source primaire, `col@<sourceId>` sinon. */
const allRefs = computed<string[]>(() =>
  columnGroups.value.flatMap((g) =>
    g.columns.map((c) => (g.isPrimary || !g.sourceId ? c.name : `${c.name}@${g.sourceId}`)),
  ),
)

/**
 * En mode « fiche », une config vide = toutes les colonnes (le rendu retombe sur
 * `Object.keys(row)`) : on reflète ce repli dans le picker. Le mode « related »
 * exige au contraire des colonnes explicites ([0] = libellé, [1] = valeur).
 */
const cols = computed<string[]>(() => {
  const c = props.block.fieldMapping.columns
  if (c?.length) return c
  return isRelated.value ? [] : allRefs.value
})
const datasetName = computed(() =>
  props.block.datasetId
    ? (datasets.readyDatasets.find((d: DatasetMeta) => d.id === props.block.datasetId)?.name ?? 'Source sélectionnée')
    : 'Aucune source',
)

function toggleColumn(col: string) {
  const cur = cols.value
  if (cur.includes(col)) {
    if (!isRelated.value && cur.length <= 1) return
    updateMapping('columns', cur.filter((c) => c !== col))
  } else {
    updateMapping('columns', [...cur, col])
  }
}

const sourceDrill = useSourceDrillIn()
</script>

<template>
  <div>
    <template v-if="activeTab === 'data'">
      <div class="flex flex-col gap-[11px] px-4 pb-1 pt-3">
        <FieldPicker
          label="Source"
          :value="datasetName"
          :action="block.datasetId ? 'Changer' : 'Choisir'"
          @open="sourceDrill.open({ block, singleSource: true })"
        />

        <template v-if="block.datasetId">
          <FieldColumns
            :label="isRelated ? 'Colonnes (1re = libellé, 2e = valeur)' : 'Colonnes affichées'"
            hint="cliquez pour ajouter / retirer"
            :groups="columnGroups"
            :primary-source-id="primaryId"
            :selected="cols"
            @pick="toggleColumn"
          />
          <div v-if="!isRelated" class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-[var(--studio-muted)]">Colonne de titre</label>
            <FieldColumns
              :groups="columnGroups"
              :primary-source-id="primaryId"
              :selected="block.fieldMapping.recordTitleColumn ?? null"
              none-label="Première colonne"
              @pick="updateMapping('recordTitleColumn', $event)"
              @none="updateMapping('recordTitleColumn', undefined)"
            />
          </div>
          <FieldNote v-if="isRelated">
            Sur une page « fan-out », chaque puce lie automatiquement vers la page de sa valeur.
          </FieldNote>
          <FieldNote v-else>
            La fiche affiche la <b>1re ligne</b> après filtres + tri (onglet Filtres — tri croissant = min, décroissant = max).
          </FieldNote>
        </template>
        <FieldNote v-else>Choisissez une source de données.</FieldNote>
      </div>
    </template>

    <template v-if="activeTab === 'filters'">
      <div class="flex flex-col gap-[11px] px-4 pb-1 pt-3">
        <FieldNote v-if="!block.datasetId">Connectez d'abord une source dans l'onglet Données.</FieldNote>
        <template v-else>
          <BlockFiltersField :block="block" mode="primary" />

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-[var(--studio-muted)]">{{ isRelated ? 'Trier par' : 'Trier par (choix de la ligne)' }}</label>
            <FieldColumns
              :groups="columnGroups"
              :primary-source-id="primaryId"
              :selected="block.config.sortColumn ?? null"
              none-label="Ordre naturel"
              @pick="updateConfig('sortColumn', $event)"
              @none="updateConfig('sortColumn', null); updateConfig('sortDirection', null)"
            />
            <div v-if="block.config.sortColumn" class="grid grid-cols-2 gap-1.5">
              <button
                class="rounded-xl border py-2 text-xs font-semibold transition-colors"
                :class="(block.config.sortDirection ?? 'asc') === 'asc' ? 'cfg-active' : 'cfg-inactive'"
                @click="updateConfig('sortDirection', 'asc')"
              >Croissant</button>
              <button
                class="rounded-xl border py-2 text-xs font-semibold transition-colors"
                :class="block.config.sortDirection === 'desc' ? 'cfg-active' : 'cfg-inactive'"
                @click="updateConfig('sortDirection', 'desc')"
              >Décroissant</button>
            </div>
          </div>

          <div v-if="isRelated" class="flex items-center justify-between gap-2">
            <label class="text-xs font-semibold text-[var(--studio-muted)]">Nombre max de puces</label>
            <input
              type="number" min="1" max="50"
              class="cfg-input w-[80px] [appearance:textfield]"
              :value="block.config.rowLimit ?? 8"
              @input="updateConfig('rowLimit', Number(($event.target as HTMLInputElement).value) || 8)"
            />
          </div>
        </template>
      </div>
    </template>

    <template v-if="activeTab === 'style'">
      <div class="flex flex-col gap-1.5 px-4 pb-1 pt-3">
        <label class="text-xs font-semibold text-[var(--studio-muted)]">Titre du bloc</label>
        <input
          type="text" class="cfg-input" placeholder="Ex : Station la moins chère"
          :value="block.config.title ?? ''"
          @input="updateConfig('title', ($event.target as HTMLInputElement).value || undefined)"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
@reference "tailwindcss";
.cfg-input {
  box-sizing: border-box;
  width: 100%;
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

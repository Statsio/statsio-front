<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import type { SearchUnionGroup, StudioBlock } from '@/types/studio'
import StudioField from './StudioField.vue'
import FieldNote from './FieldNote.vue'

const props = defineProps<{ block: StudioBlock }>()

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()

const groups = computed<SearchUnionGroup[]>(() => props.block.searchUnionGroups ?? [])

watch(
  () => groups.value.map((g) => g.source.datasetId).join('|'),
  () => groups.value.forEach((g) => { if (g.source.datasetId) datasets.loadSchema(g.source.datasetId) }),
  { immediate: true },
)

function schemaColumns(datasetId: string) {
  return datasets.getSchema(datasetId)?.columns ?? []
}

function refFor(group: SearchUnionGroup, columnName: string): string {
  return `${columnName}@${group.source.id}`
}

function addGroup() {
  studio.addSearchUnionGroup(props.block.id)
}
function removeGroup(groupId: string) {
  studio.removeSearchUnionGroup(props.block.id, groupId)
}
function setDataset(groupId: string, datasetId: string) {
  studio.setSearchUnionGroupDataset(props.block.id, groupId, datasetId)
  if (datasetId) datasets.loadSchema(datasetId)
}
function toggleColumn(group: SearchUnionGroup, columnName: string, alt: boolean) {
  const ref = refFor(group, columnName)
  const primaryList = group.searchColumns ?? []
  const altList = group.searchAltColumns ?? []
  if (alt) {
    const next = altList.includes(ref) ? altList.filter((r) => r !== ref) : [...altList, ref]
    studio.setSearchUnionGroupAltColumns(props.block.id, group.id, next)
  } else {
    const next = primaryList.includes(ref) ? primaryList.filter((r) => r !== ref) : [...primaryList, ref]
    studio.setSearchUnionGroupColumns(props.block.id, group.id, next)
  }
}
</script>

<template>
  <StudioField label="Autres sources" hint="sans lien avec la source principale">
    <div class="flex flex-col gap-3">
      <div
        v-for="group in groups"
        :key="group.id"
        class="flex flex-col gap-2.5 rounded-xl border border-[var(--studio-line)] p-3"
      >
        <div class="flex items-center gap-2">
          <select
            class="studio-input min-w-0 flex-1 !py-1.5 !text-[12px]"
            :value="group.source.datasetId"
            @change="setDataset(group.id, ($event.target as HTMLSelectElement).value)"
          >
            <option value="" disabled>Choisir un dataset…</option>
            <option v-for="d in datasets.readyDatasets" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
          <button
            type="button"
            class="shrink-0 text-[11px] font-semibold text-[var(--studio-faint)] hover:text-[var(--color-error)]"
            @click="removeGroup(group.id)"
          >Retirer</button>
        </div>

        <template v-if="group.source.datasetId">
          <div class="flex flex-col gap-1.5">
            <span class="text-[11px] font-semibold text-[var(--studio-muted)]">Colonnes de recherche</span>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="col in schemaColumns(group.source.datasetId)"
                :key="col.name"
                type="button"
                class="rounded-[7px] px-2 py-1 font-mono text-[11px] font-semibold transition-colors"
                :class="(group.searchColumns ?? []).includes(refFor(group, col.name))
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--studio-tag)] text-[var(--studio-tag-ink)]'"
                @click="toggleColumn(group, col.name, false)"
              >{{ col.name }}</button>
            </div>
          </div>

          <div v-if="(group.searchColumns ?? []).length" class="flex flex-col gap-1.5">
            <span class="text-[11px] font-semibold text-[var(--studio-muted)]">Colonnes secondaires (« ou »)</span>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="col in schemaColumns(group.source.datasetId)"
                :key="col.name"
                type="button"
                class="rounded-[7px] px-2 py-1 font-mono text-[11px] font-semibold transition-colors"
                :class="(group.searchAltColumns ?? []).includes(refFor(group, col.name))
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--studio-tag)] text-[var(--studio-tag-ink)]'"
                @click="toggleColumn(group, col.name, true)"
              >{{ col.name }}</button>
            </div>
          </div>
        </template>
      </div>

      <button
        type="button"
        class="self-start rounded-lg border-[1.5px] border-dashed border-[var(--studio-line-strong)] px-2.5 py-1 text-[11.5px] font-bold text-[var(--color-primary)]"
        @click="addGroup"
      >+ Ajouter une source</button>

      <FieldNote>
        Ces sources n'ont pas besoin de colonne commune avec la source principale :
        chaque source est cherchée séparément et les résultats sont empilés dans la
        même liste (équivalent d'un
        <strong>UNION ALL</strong> → empile toutes les lignes, y compris les doublons ;
        un <strong>UNION</strong> empilerait les lignes mais supprimerait les doublons).
        Le titre/la description d'un résultat de ces sources suit automatiquement la
        première colonne de recherche trouvée (pas de mise en forme personnalisée,
        contrairement à la source principale).
      </FieldNote>
    </div>
  </StudioField>
</template>

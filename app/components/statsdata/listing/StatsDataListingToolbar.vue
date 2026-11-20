<script setup lang="ts">
import { ref } from 'vue'
import DsChip from '@/components/ds/DsChip.vue'
import DsInput from '@/components/ds/DsInput.vue'
import DsKbd from '@/components/ds/DsKbd.vue'
import DsSegmented from '@/components/ds/DsSegmented.vue'
import DsSliceBar from '@/components/ds/DsSliceBar.vue'
import DsSwatch from '@/components/ds/DsSwatch.vue'
import DsSwitch from '@/components/ds/DsSwitch.vue'
import { useRegisterSearchTarget } from '@/composables/useSearchTarget'
import { LISTING_SORTS, type RubricSlice } from '@/lib/listing-rubrics'
import { STATSDATA_TOGGLES, type StatsDataToggles } from '@/lib/statsdata-listing'
import type { CatalogSort, CatalogView } from '@/types/catalog'

/**
 * Barre d'outils du listing StatsData (non collante) : recherche, tri, mode d'affichage,
 * « tranche » des catégories (+ catégories restantes en pastilles) et filtres
 * « Affiner ». Composant contrôlé ; la recherche devient la cible du raccourci « / »
 * et du bouton de recherche du header.
 */
defineProps<{
  slices: RubricSlice[]
  otherRubrics: RubricSlice[]
}>()

const q = defineModel<string>('q', { required: true })
const sort = defineModel<CatalogSort>('sort', { required: true })
const view = defineModel<CatalogView>('view', { required: true })
const category = defineModel<string>('category', { required: true })
const toggles = defineModel<StatsDataToggles>('toggles', { required: true })

const VIEWS: { value: CatalogView; label: string; ariaLabel: string }[] = [
  { value: 'grid', label: 'Grille', ariaLabel: 'Affichage en grille' },
  { value: 'list', label: 'Liste', ariaLabel: 'Affichage en liste' },
]

const root = ref<HTMLElement | null>(null)
const input = ref<InstanceType<typeof DsInput> | null>(null)
useRegisterSearchTarget(root, () => input.value?.focus())

function toggleCategory(value: string) {
  category.value = category.value === value ? '' : value
}
</script>

<template>
  <section ref="root" class="sdtools ds-band" aria-label="Rechercher et filtrer les StatsData">
    <div class="ds-max sdtools__in">
      <div class="sdtools__row">
        <DsInput
          ref="input"
          v-model="q"
          type="search"
          class="sdtools__search"
          autocomplete="off"
          aria-label="Rechercher un StatsData"
          placeholder="Rechercher un dataset, une source, un indicateur…"
        >
          <template #leading>
            <svg width="18" height="18" viewBox="0 0 16 16">
              <circle cx="7" cy="7" r="5.2" fill="none" stroke="currentColor" stroke-width="1.8" />
              <path
                d="M11 11l3.5 3.5"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </template>
          <template #trailing>
            <DsKbd aria-hidden="true">/</DsKbd>
          </template>
        </DsInput>
        <DsSegmented v-model="sort" :options="LISTING_SORTS" label="Trier par" size="sm" />
        <DsSegmented v-model="view" :options="VIEWS" label="Affichage">
          <template #option="{ option }">
            <svg
              v-if="option.value === 'grid'"
              width="15"
              height="15"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <g fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="1.5" y="1.5" width="5.5" height="5.5" />
                <rect x="9" y="1.5" width="5.5" height="5.5" />
                <rect x="1.5" y="9" width="5.5" height="5.5" />
                <rect x="9" y="9" width="5.5" height="5.5" />
              </g>
            </svg>
            <svg v-else width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M1.5 3h13M1.5 8h13M1.5 13h13"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </template>
        </DsSegmented>
      </div>

      <div v-if="slices.length > 1" class="sdtools__row sdtools__row--top">
        <span id="sdtools-cat" class="sdtools__lab">Catégorie</span>
        <div class="sdtools__cats">
          <DsSliceBar
            v-model="category"
            :slices="slices"
            labelledby="sdtools-cat"
            :unit="{ one: 'StatsData', many: 'StatsData' }"
          />
          <div
            v-if="otherRubrics.length"
            class="sdtools__chips"
            role="group"
            aria-label="Autres catégories"
          >
            <DsChip
              v-for="r in otherRubrics"
              :key="r.value"
              :pressed="category === r.value"
              @click="toggleCategory(r.value)"
            >
              <template #swatch><DsSwatch :color="r.color" :size="10" /></template>
              {{ r.label }}
              <template #count>{{ r.count }}</template>
            </DsChip>
          </div>
        </div>
      </div>

      <div class="sdtools__row sdtools__row--tight">
        <span class="sdtools__lab">Affiner</span>
        <DsSwitch
          v-for="t in STATSDATA_TOGGLES"
          :key="t.key"
          :model-value="toggles[t.key]"
          @update:model-value="toggles = { ...toggles, [t.key]: $event }"
        >
          {{ t.label }}
        </DsSwitch>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sdtools__in {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-block: 16px;
}
.sdtools__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.sdtools__row--tight {
  gap: 8px;
}
.sdtools__row--top {
  align-items: flex-start;
}
.sdtools__row--top .sdtools__lab {
  padding-top: 14px;
}
.sdtools__search {
  flex: 1 1 320px;
  height: 48px;
  border-radius: 4px;
  box-shadow: 4px 4px 0 var(--ds-sh2);
}
.sdtools__lab {
  flex: none;
  min-width: 74px;
  color: var(--ds-muted);
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
@media (max-width: 640px) {
  .sdtools__lab {
    width: 100%;
    min-width: 0;
  }
  .sdtools__row--top .sdtools__lab {
    padding-top: 0;
  }
}
.sdtools__cats {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.sdtools__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>

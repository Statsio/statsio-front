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
import { ARTICLE_SORTS, type RubricSlice } from '@/lib/articles-listing'
import type { CatalogFacet, CatalogSort, CatalogView } from '@/types/catalog'

/**
 * Barre d'outils du listing : recherche, tri, mode d'affichage, « tranche »
 * des rubriques (+ rubriques restantes en pastilles), formats et « StatsData lié ».
 * Composant contrôlé : tout l'état vit dans `usePublicCatalog`.
 * La recherche devient la cible du raccourci « / » et du bouton du header.
 */
defineProps<{
  slices: RubricSlice[]
  otherRubrics: RubricSlice[]
  formats: CatalogFacet[]
}>()

const q = defineModel<string>('q', { required: true })
const sort = defineModel<CatalogSort>('sort', { required: true })
const view = defineModel<CatalogView>('view', { required: true })
const category = defineModel<string>('category', { required: true })
const format = defineModel<string>('format', { required: true })
const hasData = defineModel<boolean>('hasData', { required: true })

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
  <section ref="root" class="atools ds-band" aria-label="Rechercher et filtrer les articles">
    <div class="ds-max atools__in">
      <div class="atools__row">
        <DsInput
          ref="input"
          v-model="q"
          type="search"
          class="atools__search"
          autocomplete="off"
          aria-label="Rechercher un article"
          placeholder="Rechercher un article, un auteur, un sujet…"
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
        <DsSegmented v-model="sort" :options="ARTICLE_SORTS" label="Trier par" size="sm" />
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

      <div v-if="slices.length > 1" class="atools__row atools__row--top">
        <span id="atools-cat" class="atools__lab">Rubrique</span>
        <div class="atools__rubrics">
          <DsSliceBar
            v-model="category"
            :slices="slices"
            labelledby="atools-cat"
            :unit="{ one: 'article', many: 'articles' }"
          />
          <div
            v-if="otherRubrics.length"
            class="atools__others"
            role="group"
            aria-label="Autres rubriques"
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

      <div class="atools__row">
        <template v-if="formats.length > 1">
          <span id="atools-fmt" class="atools__lab">Format</span>
          <div class="atools__chips" role="group" aria-labelledby="atools-fmt">
            <DsChip
              v-for="f in formats"
              :key="f.value || 'all'"
              :pressed="format === f.value"
              @click="format = f.value"
            >
              {{ f.label }}
              <template v-if="f.value" #count>{{ f.count }}</template>
            </DsChip>
          </div>
        </template>
        <span class="atools__spacer" />
        <DsSwitch v-model="hasData">Avec StatsData lié</DsSwitch>
      </div>
    </div>
  </section>
</template>

<style scoped>
.atools__in {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-block: 16px;
}
.atools__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.atools__row--top {
  align-items: flex-start;
}
.atools__row--top .atools__lab {
  padding-top: 14px;
}
.atools__search {
  flex: 1 1 320px;
  height: 48px;
  border-radius: 4px;
  box-shadow: 4px 4px 0 var(--ds-sh2);
}
.atools__lab {
  flex: none;
  min-width: 74px;
  color: var(--ds-muted);
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
@media (max-width: 640px) {
  .atools__lab {
    width: 100%;
    min-width: 0;
  }
  .atools__row--top .atools__lab {
    padding-top: 0;
  }
}
.atools__rubrics {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.atools__others,
.atools__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.atools__spacer {
  flex: 1;
}
</style>

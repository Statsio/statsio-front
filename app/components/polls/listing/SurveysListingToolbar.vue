<script setup lang="ts">
import { ref } from 'vue'
import DsChip from '@/components/ds/DsChip.vue'
import DsInput from '@/components/ds/DsInput.vue'
import DsKbd from '@/components/ds/DsKbd.vue'
import DsSegmented from '@/components/ds/DsSegmented.vue'
import DsSliceBar from '@/components/ds/DsSliceBar.vue'
import DsSwatch from '@/components/ds/DsSwatch.vue'
import DsSwitch from '@/components/ds/DsSwitch.vue'
import SurveyKindGlyph from './SurveyKindGlyph.vue'
import { useRegisterSearchTarget } from '@/composables/useSearchTarget'
import { LISTING_SORTS, type RubricSlice } from '@/lib/listing-rubrics'
import { SURVEY_STATUSES } from '@/lib/surveys-listing'
import type { CatalogSort, CatalogView, SurveyKind, SurveyStatusFilter } from '@/types/catalog'

/**
 * Barre d'outils du listing des sondages : recherche, tri, affichage, type de
 * consultation, « tranche » des thèmes (+ thèmes restants en pastilles), statut
 * et « Pas encore participé ». Composant contrôlé ; la recherche devient la cible
 * du raccourci « / » et du bouton de recherche du header.
 */
defineProps<{
  /** types de consultation avec leur effectif (« Tous » en tête) */
  kinds: { value: SurveyKind | ''; label: string; count: number }[]
  slices: RubricSlice[]
  otherRubrics: RubricSlice[]
}>()

const q = defineModel<string>('q', { required: true })
const sort = defineModel<CatalogSort>('sort', { required: true })
const view = defineModel<CatalogView>('view', { required: true })
const kind = defineModel<SurveyKind | ''>('kind', { required: true })
const category = defineModel<string>('category', { required: true })
const status = defineModel<SurveyStatusFilter | ''>('status', { required: true })
const notParticipated = defineModel<boolean>('notParticipated', { required: true })

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
  <section ref="root" class="svtools ds-band" aria-label="Rechercher et filtrer les consultations">
    <div class="ds-max svtools__in">
      <div class="svtools__row">
        <DsInput
          ref="input"
          v-model="q"
          type="search"
          class="svtools__search"
          autocomplete="off"
          aria-label="Rechercher une consultation"
          placeholder="Rechercher un sondage, une pétition, une chaîne…"
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

      <div class="svtools__row">
        <span id="svtools-kind" class="svtools__lab">Type</span>
        <DsSegmented
          v-model="kind"
          :options="kinds"
          label="Type de consultation"
          size="sm"
          class="svtools__kinds"
        >
          <template #option="{ option }">
            <SurveyKindGlyph v-if="option.value" :kind="option.value" :size="14" />
            {{ option.label }}
            <span v-if="option.value" class="svtools__count">{{
              kinds.find((k) => k.value === option.value)?.count
            }}</span>
          </template>
        </DsSegmented>
      </div>

      <div v-if="slices.length > 1" class="svtools__row svtools__row--top">
        <span id="svtools-cat" class="svtools__lab">Thème</span>
        <div class="svtools__cats">
          <DsSliceBar
            v-model="category"
            :slices="slices"
            labelledby="svtools-cat"
            :unit="{ one: 'consultation', many: 'consultations' }"
          />
          <div
            v-if="otherRubrics.length"
            class="svtools__chips"
            role="group"
            aria-label="Autres thèmes"
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

      <div class="svtools__row">
        <span class="svtools__lab">Statut</span>
        <DsSegmented v-model="status" :options="SURVEY_STATUSES" label="Statut" size="sm" />
        <span class="svtools__spacer" />
        <DsSwitch v-model="notParticipated">Pas encore participé</DsSwitch>
      </div>
    </div>
  </section>
</template>

<style scoped>
.svtools__in {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-block: 16px;
}
.svtools__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.svtools__row--top {
  align-items: flex-start;
}
.svtools__row--top .svtools__lab {
  padding-top: 14px;
}
.svtools__search {
  flex: 1 1 320px;
  height: 48px;
  border-radius: 4px;
  box-shadow: 4px 4px 0 var(--ds-sh2);
}
.svtools__lab {
  flex: none;
  min-width: 74px;
  color: var(--ds-muted);
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
@media (max-width: 640px) {
  .svtools__lab {
    width: 100%;
    min-width: 0;
  }
  .svtools__row--top .svtools__lab {
    padding-top: 0;
  }
}
.svtools__kinds {
  flex: 0 1 auto;
  flex-wrap: wrap;
  max-width: 100%;
}
.svtools__count {
  font: 500 12px var(--ds-num);
  opacity: 0.8;
}
.svtools__cats {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.svtools__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.svtools__spacer {
  flex: 1;
}
</style>

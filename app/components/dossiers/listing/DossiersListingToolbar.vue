<script setup lang="ts">
import { ref } from 'vue'
import DsChip from '@/components/ds/DsChip.vue'
import DsInput from '@/components/ds/DsInput.vue'
import DsKbd from '@/components/ds/DsKbd.vue'
import DsSegmented from '@/components/ds/DsSegmented.vue'
import DsSliceBar from '@/components/ds/DsSliceBar.vue'
import DsSwatch from '@/components/ds/DsSwatch.vue'
import DsSwitch from '@/components/ds/DsSwitch.vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import statsioLogo from '@/assets/brand/statsio-logo.svg'
import tvstatsLogo from '@/assets/brand/tvstats/tvstats-logo.svg'
import medistatsLogo from '@/assets/brand/medistats/medistats-logo.svg'
import { useRegisterSearchTarget } from '@/composables/useSearchTarget'
import { DOSSIER_DOMAINS, DOSSIER_SORTS, DOSSIER_UNIT, dossierTypeMeta } from '@/lib/dossiers-listing'
import type { RubricSlice } from '@/lib/listing-rubrics'
import type { CatalogView } from '@/types/catalog'
import type { DossierCatalogSort, DossierContentType } from '@/types/dossier'
import type { SubBrand } from '@/types/sub-brand'

/**
 * Barre d'outils du listing des dossiers : recherche (dossiers et contenus rangés),
 * tri, affichage, « Contient » (type de contenu), « tranche » des thèmes (+ thèmes
 * restants en pastilles), domaine (Statsio seulement) et « Dossiers suivis ».
 * Composant contrôlé ; la recherche devient la cible du raccourci « / » et du
 * bouton de recherche du header.
 */
defineProps<{
  /** options « Contient » avec le nombre de dossiers concernés (« Tout » en tête) */
  types: { value: DossierContentType | ''; label: string; count: number }[]
  slices: RubricSlice[]
  otherRubrics: RubricSlice[]
  /** le domaine n'est proposé que sur Statsio */
  showDomain: boolean
}>()

const q = defineModel<string>('q', { required: true })
const sort = defineModel<DossierCatalogSort>('sort', { required: true })
const view = defineModel<CatalogView>('view', { required: true })
const contentType = defineModel<DossierContentType | ''>('contentType', { required: true })
const category = defineModel<string>('category', { required: true })
const domain = defineModel<SubBrand | ''>('domain', { required: true })
const followedOnly = defineModel<boolean>('followedOnly', { required: true })

const VIEWS: { value: CatalogView; label: string; ariaLabel: string }[] = [
  { value: 'grid', label: 'Grille', ariaLabel: 'Affichage en grille' },
  { value: 'list', label: 'Liste', ariaLabel: 'Affichage en liste' },
]
const DOMAIN_LOGOS: Record<SubBrand, string> = {
  statsio: statsioLogo,
  tvstats: tvstatsLogo,
  medistats: medistatsLogo,
}

const root = ref<HTMLElement | null>(null)
const input = ref<InstanceType<typeof DsInput> | null>(null)
useRegisterSearchTarget(root, () => input.value?.focus())

function toggleCategory(value: string) {
  category.value = category.value === value ? '' : value
}
</script>

<template>
  <section ref="root" class="dtools ds-band" aria-label="Rechercher et filtrer les dossiers">
    <div class="ds-max dtools__in">
      <div class="dtools__row">
        <DsInput
          ref="input"
          v-model="q"
          type="search"
          class="dtools__search"
          autocomplete="off"
          aria-label="Rechercher un dossier"
          placeholder="Rechercher un dossier ou un contenu rangé dedans…"
        >
          <template #leading>
            <svg width="18" height="18" viewBox="0 0 16 16">
              <circle cx="7" cy="7" r="5.2" fill="none" stroke="currentColor" stroke-width="1.8" />
              <path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </template>
          <template #trailing>
            <DsKbd aria-hidden="true">/</DsKbd>
          </template>
        </DsInput>
        <DsSegmented v-model="sort" :options="DOSSIER_SORTS" label="Trier par" size="sm" />
        <DsSegmented v-model="view" :options="VIEWS" label="Affichage">
          <template #option="{ option }">
            <svg v-if="option.value === 'grid'" width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
              <g fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="1.5" y="1.5" width="5.5" height="5.5" />
                <rect x="9" y="1.5" width="5.5" height="5.5" />
                <rect x="1.5" y="9" width="5.5" height="5.5" />
                <rect x="9" y="9" width="5.5" height="5.5" />
              </g>
            </svg>
            <svg v-else width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M1.5 3h13M1.5 8h13M1.5 13h13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </template>
        </DsSegmented>
      </div>

      <div class="dtools__row">
        <span class="dtools__lab">Contient</span>
        <DsSegmented
          v-model="contentType"
          :options="types"
          label="Type de contenu rangé"
          size="sm"
          class="dtools__wrap"
        >
          <template #option="{ option }">
            <DsTypeGlyph v-if="option.value" :kind="dossierTypeMeta(option.value).glyph" :size="14" />
            {{ option.label }}
            <span v-if="option.value" class="dtools__count">{{
              types.find((t) => t.value === option.value)?.count
            }}</span>
          </template>
        </DsSegmented>
      </div>

      <div v-if="slices.length > 1" class="dtools__row dtools__row--top">
        <span id="dtools-cat" class="dtools__lab">Thème</span>
        <div class="dtools__cats">
          <DsSliceBar v-model="category" :slices="slices" labelledby="dtools-cat" :unit="DOSSIER_UNIT" />
          <div v-if="otherRubrics.length" class="dtools__chips" role="group" aria-label="Autres thèmes">
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

      <div class="dtools__row">
        <template v-if="showDomain">
          <span class="dtools__lab">Domaine</span>
          <DsSegmented v-model="domain" :options="DOSSIER_DOMAINS" label="Domaine" size="sm" class="dtools__wrap">
            <template #option="{ option }">
              <img v-if="option.value" :src="DOMAIN_LOGOS[option.value]" alt="" width="16" height="16" />
              {{ option.label }}
            </template>
          </DsSegmented>
        </template>
        <span class="dtools__spacer" />
        <DsSwitch v-model="followedOnly">Dossiers suivis</DsSwitch>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dtools__in {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-block: 16px;
}
.dtools__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.dtools__row--top {
  align-items: flex-start;
}
.dtools__row--top .dtools__lab {
  padding-top: 14px;
}
.dtools__search {
  flex: 1 1 320px;
  height: 48px;
  border-radius: 4px;
  box-shadow: 4px 4px 0 var(--ds-sh2);
}
.dtools__lab {
  flex: none;
  min-width: 74px;
  color: var(--ds-muted);
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
@media (max-width: 640px) {
  .dtools__lab {
    width: 100%;
    min-width: 0;
  }
  .dtools__row--top .dtools__lab {
    padding-top: 0;
  }
}
.dtools__wrap {
  flex: 0 1 auto;
  flex-wrap: wrap;
  max-width: 100%;
}
.dtools__count {
  font: 500 12px var(--ds-num);
  opacity: 0.8;
}
.dtools__cats {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.dtools__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.dtools__spacer {
  flex: 1;
}
</style>

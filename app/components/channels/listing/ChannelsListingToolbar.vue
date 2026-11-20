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
import { CHANNEL_SORTS } from '@/lib/channels-listing'
import type { RubricSlice } from '@/lib/listing-rubrics'
import type { ChannelCatalogSort, ChannelCatalogView } from '@/types/channel-catalog'

/**
 * Barre d'outils du listing des chaînes : recherche, tri, affichage, type de
 * chaîne, « tranche » des thèmes (+ thèmes restants en pastilles), rythme,
 * « vérifiées » et « mes abonnements ». Composant contrôlé ; la recherche devient
 * la cible du raccourci « / » et du bouton de recherche du header.
 */
type Option = { value: string; label: string; count: number }
defineProps<{
  kinds: Option[]
  paces: Option[]
  slices: RubricSlice[]
  otherThemes: RubricSlice[]
}>()

const q = defineModel<string>('q', { required: true })
const sort = defineModel<ChannelCatalogSort>('sort', { required: true })
const view = defineModel<ChannelCatalogView>('view', { required: true })
const kind = defineModel<string>('kind', { required: true })
const theme = defineModel<string>('theme', { required: true })
const pace = defineModel<string>('pace', { required: true })
const verified = defineModel<boolean>('verified', { required: true })
const followed = defineModel<boolean>('followed', { required: true })

const VIEWS: { value: ChannelCatalogView; label: string; ariaLabel: string }[] = [
  { value: 'grid', label: 'Grille', ariaLabel: 'Affichage en grille' },
  { value: 'list', label: 'Liste', ariaLabel: 'Affichage en liste' },
]

const root = ref<HTMLElement | null>(null)
const input = ref<InstanceType<typeof DsInput> | null>(null)
useRegisterSearchTarget(root, () => input.value?.focus())

function toggleTheme(value: string) {
  theme.value = theme.value === value ? '' : value
}
</script>

<template>
  <section ref="root" class="chtools ds-band" aria-label="Rechercher et filtrer les chaînes">
    <div class="ds-max chtools__in">
      <div class="chtools__row">
        <DsInput
          ref="input"
          v-model="q"
          type="search"
          class="chtools__search"
          autocomplete="off"
          aria-label="Rechercher une chaîne"
          placeholder="Rechercher une chaîne, une rédaction, un analyste…"
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
        <DsSegmented v-model="sort" :options="CHANNEL_SORTS" label="Trier par" size="sm" />
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

      <div class="chtools__row">
        <span class="chtools__lab">Type</span>
        <DsSegmented
          v-model="kind"
          :options="kinds"
          label="Type de chaîne"
          size="sm"
          class="chtools__wrap"
        >
          <template #option="{ option }">
            {{ option.label }}
            <span v-if="option.value" class="chtools__count">{{
              kinds.find((k) => k.value === option.value)?.count
            }}</span>
          </template>
        </DsSegmented>
      </div>

      <div v-if="slices.length > 1" class="chtools__row chtools__row--top">
        <span id="chtools-theme" class="chtools__lab">Thème</span>
        <div class="chtools__themes">
          <DsSliceBar
            v-model="theme"
            :slices="slices"
            labelledby="chtools-theme"
            :unit="{ one: 'chaîne', many: 'chaînes' }"
          />
          <div
            v-if="otherThemes.length"
            class="chtools__chips"
            role="group"
            aria-label="Autres thèmes"
          >
            <DsChip
              v-for="t in otherThemes"
              :key="t.value"
              :pressed="theme === t.value"
              @click="toggleTheme(t.value)"
            >
              <template #swatch><DsSwatch :color="t.color" :size="10" /></template>
              {{ t.label }}
              <template #count>{{ t.count }}</template>
            </DsChip>
          </div>
          <p class="chtools__note">Une chaîne peut couvrir plusieurs thèmes.</p>
        </div>
      </div>

      <div class="chtools__row">
        <span class="chtools__lab">Activité</span>
        <DsSegmented
          v-model="pace"
          :options="paces"
          label="Rythme de publication"
          size="sm"
          class="chtools__wrap"
        >
          <template #option="{ option }">
            {{ option.label }}
            <span v-if="option.value" class="chtools__count">{{
              paces.find((p) => p.value === option.value)?.count
            }}</span>
          </template>
        </DsSegmented>
        <span class="chtools__spacer" />
        <DsSwitch v-model="verified">Chaînes vérifiées</DsSwitch>
        <DsSwitch v-model="followed">Mes abonnements</DsSwitch>
      </div>
    </div>
  </section>
</template>

<style scoped>
.chtools__in {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-block: 16px;
}
.chtools__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.chtools__row--top {
  align-items: flex-start;
}
.chtools__row--top .chtools__lab {
  padding-top: 14px;
}
.chtools__search {
  flex: 1 1 320px;
  height: 48px;
  border-radius: 4px;
  box-shadow: 4px 4px 0 var(--ds-sh2);
}
.chtools__lab {
  flex: none;
  min-width: 74px;
  color: var(--ds-muted);
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
@media (max-width: 640px) {
  .chtools__lab {
    width: 100%;
    min-width: 0;
  }
  .chtools__row--top .chtools__lab {
    padding-top: 0;
  }
}
.chtools__wrap {
  flex: 0 1 auto;
  flex-wrap: wrap;
  max-width: 100%;
}
.chtools__count {
  font: 500 12px var(--ds-num);
  opacity: 0.8;
}
.chtools__themes {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.chtools__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chtools__note {
  margin: 0;
  color: var(--ds-muted);
  font-size: 12.5px;
}
.chtools__spacer {
  flex: 1;
}
</style>

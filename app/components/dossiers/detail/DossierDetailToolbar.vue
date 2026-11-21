<script setup lang="ts">
import { ref } from 'vue'
import DsInput from '@/components/ds/DsInput.vue'
import DsSegmented from '@/components/ds/DsSegmented.vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import { DOSSIER_CONTENT_TYPES } from '@/lib/dossiers-listing'
import type { DossierDetailSort, DossierDetailViewMode } from '@/lib/dossier-detail'
import type { DossierContentType } from '@/types/dossier'

defineProps<{
  type: DossierContentType | ''
  counts: { all: number; article: number; statsdata: number; survey: number }
}>()

const query = defineModel<string>('query', { required: true })
const sort = defineModel<DossierDetailSort>('sort', { required: true })
const view = defineModel<DossierDetailViewMode>('view', { required: true })

const emit = defineEmits<{ 'set-type': [type: DossierContentType | ''] }>()

const search = ref<{ focus: () => void } | null>(null)
defineExpose({ focus: () => search.value?.focus() })

const sorts = [
  { value: 'new' as const, label: 'Récent' },
  { value: 'old' as const, label: 'Ancien' },
]
const views = [
  { value: 'feed' as const, label: 'Fil', ariaLabel: 'Fil chronologique' },
  { value: 'grid' as const, label: 'Grille', ariaLabel: 'Grille' },
]
</script>

<template>
  <section id="dd-tools" class="dd-tools ds-sticky-bar" aria-label="Parcourir le dossier">
    <div class="ds-max dd-tools__row">
      <div class="dd-tabs" role="group" aria-label="Type de contenu">
        <button
          type="button"
          class="dd-itab"
          :aria-pressed="type === ''"
          style="background: var(--ds-tint); color: var(--ds-text)"
          @click="emit('set-type', '')"
        >
          Tout <b>{{ counts.all }}</b>
        </button>
        <button
          v-for="meta in DOSSIER_CONTENT_TYPES"
          :key="meta.value"
          type="button"
          class="dd-itab"
          :aria-pressed="type === meta.value"
          :style="{ background: meta.color, color: meta.ink }"
          @click="emit('set-type', meta.value)"
        >
          <DsTypeGlyph :kind="meta.glyph" :size="14" :mono="type !== meta.value" :style="type === meta.value ? { color: meta.color } : undefined" />
          {{ meta.value === 'article' ? 'Articles' : meta.value === 'survey' ? 'Sondages' : 'StatsData' }}
          <b>{{ counts[meta.value] }}</b>
        </button>
      </div>
      <div class="dd-tright">
        <DsInput
          ref="search"
          v-model="query"
          class="dd-search"
          type="search"
          autocomplete="off"
          placeholder="Chercher dans le dossier…"
          aria-label="Chercher dans le dossier"
        >
          <template #leading>
            <svg width="16" height="16" viewBox="0 0 16 16" style="color: var(--ds-link)">
              <circle cx="7" cy="7" r="5.2" fill="none" stroke="currentColor" stroke-width="1.8" />
              <path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </template>
        </DsInput>
        <DsSegmented v-model="sort" :options="sorts" label="Ordre" />
        <DsSegmented v-model="view" :options="views" label="Affichage">
          <template #option="{ option }">
            <svg v-if="option.value === 'feed'" width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 1.5v13" stroke="currentColor" stroke-width="1.8" />
              <rect x="6" y="2" width="8.5" height="4.5" fill="none" stroke="currentColor" stroke-width="1.8" />
              <rect x="6" y="9.5" width="8.5" height="4.5" fill="none" stroke="currentColor" stroke-width="1.8" />
            </svg>
            <svg v-else width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
              <rect x="1.5" y="1.5" width="5.5" height="5.5" fill="none" stroke="currentColor" stroke-width="1.8" />
              <rect x="9" y="1.5" width="5.5" height="5.5" fill="none" stroke="currentColor" stroke-width="1.8" />
              <rect x="1.5" y="9" width="5.5" height="5.5" fill="none" stroke="currentColor" stroke-width="1.8" />
              <rect x="9" y="9" width="5.5" height="5.5" fill="none" stroke="currentColor" stroke-width="1.8" />
            </svg>
          </template>
        </DsSegmented>
      </div>
    </div>
  </section>
</template>

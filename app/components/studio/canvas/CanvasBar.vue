<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioMetaStore } from '@/stores/studio-meta'
import { FORM_BLOCK_TYPES } from '@/types/studio'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import StudioIcon from '../ui/StudioIcon.vue'
import StudioPagePicker from '../StudioPagePicker.vue'

/**
 * Barre collante en tête du canevas.
 * StatsData : onglets de pages (fan-out signalé), « + Page », gestion, paramètres de
 * la page. Article : nombre de blocs StatsData liés. Sondage : format.
 * À droite : interrupteur « Types de blocs » (étiquettes de tous les blocs).
 */
const studio = useStudioStore()
const meta = useStudioMetaStore()
const picker = ref<{ openAddModal: () => void } | null>(null)

const type = computed(() => studio.content?.type ?? 'statsdata')

const visibleParams = (pageId: string) =>
  (studio.pages.find((p) => p.id === pageId)?.params ?? []).filter((p) => p.name)

function fanOutLabel(pageId: string): string | null {
  const fan = visibleParams(pageId).find((p) => p.fanOut)
  return fan ? `1 URL par ${fan.label || fan.name}` : null
}

const currentParams = computed(() =>
  visibleParams(studio.currentPageId)
    .filter((p) => !p.searchBlockId)
    .map((p) => `{{${p.name}}}`)
    .join(' · '),
)

const embedCount = computed(() => studio.blocks.filter((b) => b.type === 'sd-embed').length)

const SURVEY_KIND: Record<string, string> = {
  single_question: 'Question rapide',
  long: 'Questionnaire',
  petition: 'Pétition',
}
const surveyKind = computed(() => SURVEY_KIND[meta.doc?.survey_kind ?? studio.content?.survey_kind ?? 'single_question'])
const questionCount = computed(() => studio.blocks.filter((b) => FORM_BLOCK_TYPES.includes(b.type)).length)
</script>

<template>
  <div class="st-cv-bar">
    <!-- StatsData : pages -->
    <template v-if="type === 'statsdata'">
      <div class="flex min-w-0 flex-wrap gap-1" role="group" aria-label="Pages">
        <button
          v-for="p in studio.pages"
          :key="p.id"
          type="button"
          class="st-ptab"
          :aria-pressed="studio.currentPageId === p.id"
          @click="studio.switchPage(p.id)"
        >
          {{ p.title || 'Page' }}
          <span v-if="fanOutLabel(p.id)" class="st-lbl !text-[9.5px]">· {{ fanOutLabel(p.id) }}</span>
        </button>
        <button v-if="!studio.isPreview" type="button" class="st-ptab st-ptab--add" @click="picker?.openAddModal()">
          <StudioIcon name="plus" :size="13" />Page
        </button>
        <StudioPagePicker v-if="!studio.isPreview" ref="picker" manage />
      </div>
      <span v-if="currentParams" class="st-pill hidden md:inline-flex">
        <StudioIcon name="param" :size="12" />{{ currentParams }}
      </span>
    </template>

    <!-- Article -->
    <template v-else-if="type === 'article'">
      <span class="st-pill"><DsTypeGlyph kind="article" :size="12" />Article · 1 page</span>
      <span v-if="embedCount" class="st-pill st-pill--data hidden md:inline-flex">
        <DsTypeGlyph kind="statsdata" :size="12" mono />{{ embedCount }} bloc{{ embedCount > 1 ? 's' : '' }} StatsData lié{{ embedCount > 1 ? 's' : '' }}
      </span>
    </template>

    <!-- Sondage -->
    <template v-else>
      <span class="st-pill"><DsTypeGlyph kind="sondage" :size="12" />{{ surveyKind }}</span>
      <span class="st-pill hidden md:inline-flex">{{ questionCount }} question{{ questionCount > 1 ? 's' : '' }}</span>
      <span class="st-pill st-pill--ex hidden md:inline-flex">Aperçu sans réponses</span>
    </template>

    <span class="flex-1" aria-hidden="true" />

    <label v-if="!studio.isPreview" class="hidden items-center gap-2 text-[12.5px] font-semibold text-[var(--ds-muted)] md:inline-flex">
      <button
        class="st-sw"
        type="button"
        role="switch"
        :aria-checked="studio.showBlockTags"
        aria-label="Afficher les types de blocs"
        @click="studio.toggleBlockTags()"
      />
      Types de blocs
    </label>
  </div>
</template>

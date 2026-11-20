<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioMetaStore } from '@/stores/studio-meta'
import { useMediaLibrary } from '@/composables/useMediaLibrary'
import { glyphForContentType } from '@/lib/ds/types'
import { FORM_BLOCK_TYPES } from '@/types/studio'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import DsButton from '@/components/ds/DsButton.vue'
import StudioIcon from '../ui/StudioIcon.vue'

/**
 * En-tête du contenu dans le canevas, comme sur la page publiée : rubrique, titre,
 * chapô, signature, couverture. Titre → store `studio` (autosave) ; chapô et
 * couverture → `studio-meta` (PATCH). Un clic hors champ sélectionne le document
 * (inspecteur « Propriétés »).
 */
const studio = useStudioStore()
const meta = useStudioMetaStore()
const media = useMediaLibrary()

const emit = defineEmits<{ select: [] }>()
defineProps<{ selected?: boolean }>()

const type = computed(() => studio.content?.type ?? 'statsdata')
const glyph = computed(() => glyphForContentType(type.value))
const editable = computed(() => !studio.isPreview)

const kicker = computed(() => {
  const cats = meta.doc?.categories ?? studio.content?.categories ?? []
  const TYPE = { statsdata: 'StatsData', article: 'Article', survey: 'Sondage' } as const
  return [...cats.slice(0, 2), TYPE[type.value]].join(' · ')
})

const cover = computed(() => (type.value === 'survey' ? null : meta.doc?.thumbnail_url?.trim() || null))
const showCoverSlot = computed(() => type.value !== 'survey' && (!!cover.value || editable.value))

const author = computed(() =>
  meta.doc?.published_as === 'channel' && meta.doc.channel?.name ? meta.doc.channel.name : (meta.doc?.author?.name ?? 'Vous'),
)

const questionCount = computed(() => studio.blocks.filter((b) => FORM_BLOCK_TYPES.includes(b.type)).length)
const stepCount = computed(() => studio.sections.filter((s) => !s.zoneId).length)
const SURVEY_KIND: Record<string, string> = { single_question: 'Question rapide', long: 'Questionnaire', petition: 'Pétition' }
const surveyKind = computed(() => SURVEY_KIND[meta.doc?.survey_kind ?? studio.content?.survey_kind ?? 'single_question'])

const bylineMeta = computed(() => {
  if (type.value === 'statsdata') return 'mis à jour automatiquement'
  if (type.value === 'survey') {
    const d = meta.doc?.response_deadline
    return d ? `ouvert jusqu’au ${new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : 'sans date de clôture'
  }
  const words = studio.blocks.reduce((n, b) => n + String(b.config.content ?? '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length, 0)
  return `${Math.max(1, Math.round(words / 220))} min de lecture`
})

function commitTitle(e: Event) {
  const val = (e.target as HTMLElement).textContent?.trim() ?? ''
  if (val && val !== studio.content?.title) studio.setTitle(val)
  else (e.target as HTMLElement).textContent = studio.content?.title ?? ''
}
function commitChapo(e: Event) {
  const val = (e.target as HTMLElement).textContent?.trim() ?? ''
  if (val !== (meta.doc?.description ?? '')) void meta.patch({ description: val || null })
}
function blurOnEnter(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    ;(e.target as HTMLElement).blur()
  }
}

function changeCover() {
  media.open({
    mode: 'pick',
    directory: 'studio-content-thumbnails',
    onSelect: (m) => void meta.setThumbnail(m.id),
  })
}

function onHeaderClick(e: MouseEvent) {
  if (!editable.value) return
  if ((e.target as HTMLElement).closest('[contenteditable="true"], button')) return
  emit('select')
}
</script>

<template>
  <header
    class="st-doc-h"
    :class="{ 'st-doc-h--nocover': !showCoverSlot, 'is-sel': selected && editable }"
    @click="onHeaderClick"
  >
    <div class="min-w-0">
      <div class="flex flex-wrap items-center gap-2">
        <DsTypeGlyph :kind="glyph" :size="14" />
        <span class="st-lbl">{{ kicker }}</span>
      </div>

      <h1
        :contenteditable="editable ? 'true' : 'false'"
        :class="editable && 'st-editable'"
        data-ph="Titre du contenu"
        spellcheck="true"
        @blur="commitTitle"
        @keydown="blurOnEnter"
      >{{ studio.content?.title ?? '' }}</h1>

      <p
        v-if="editable || meta.doc?.description"
        class="st-chapo"
        :contenteditable="editable && meta.doc ? 'true' : 'false'"
        :class="editable && 'st-editable'"
        data-ph="Chapô : une ou deux phrases"
        @blur="commitChapo"
        @keydown="blurOnEnter"
      >{{ meta.doc?.description ?? '' }}</p>

      <div class="st-byline">
        <span class="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border-2 border-[var(--ds-ol)] bg-[var(--ds-tint)] text-[11px] font-extrabold text-[var(--ds-accent)]" aria-hidden="true">
          {{ author.slice(0, 1).toUpperCase() }}
        </span>
        <span><b>{{ author }}</b> <span class="st-meta">· {{ bylineMeta }}</span></span>
      </div>

      <div v-if="type === 'survey'" class="mt-3.5 flex flex-wrap gap-2">
        <span class="st-pill"><DsTypeGlyph kind="sondage" :size="12" />{{ surveyKind }}</span>
        <span class="st-pill">{{ questionCount }} question{{ questionCount > 1 ? 's' : '' }} · {{ stepCount }} étape{{ stepCount > 1 ? 's' : '' }}</span>
        <span class="st-pill">≈ {{ Math.max(1, Math.round(questionCount * 0.4)) }} min</span>
        <span v-if="meta.doc?.requires_identity_verification" class="st-pill st-pill--data"><StudioIcon name="id" :size="12" />Identité vérifiée</span>
      </div>
    </div>

    <div v-if="showCoverSlot" class="st-cover">
      <img v-if="cover" :src="cover" alt="" />
      <div v-else class="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--ds-muted)]">
        <StudioIcon name="image" :size="28" />
        <span class="st-meta">Aucune couverture</span>
      </div>
      <DsButton v-if="editable && meta.doc" variant="secondary" size="sm" class="st-chg" @click.stop="changeCover">
        <StudioIcon name="image" :size="14" />Changer
      </DsButton>
    </div>
  </header>

  <div v-if="type === 'survey' && meta.doc?.requires_identity_verification" class="st-idgate">
    <StudioIcon name="id" :size="22" />
    <span><b>Vérification d’identité requise.</b> Le répondant vérifie son identité avec Didit avant d’accéder au formulaire.</span>
  </div>
</template>

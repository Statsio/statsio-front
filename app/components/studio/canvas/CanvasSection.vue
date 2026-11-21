<script setup lang="ts">
import { computed, provide, onBeforeUnmount, ref } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useResolvedTokens } from '@/composables/useResolvedTokens'
import { sanitizeInlineHtml, isBlankInlineHtml } from '@/lib/inline-rich-text'
import type { Section } from '@/types/studio'
import CanvasZone from './CanvasZone.vue'
import SectionInlineText from './SectionInlineText.vue'
import { SECTION_CONTEXT } from './section-context'
import StudioIcon from '../ui/StudioIcon.vue'
import BlockInsertPopover from './BlockInsertPopover.vue'
import { useStudioToast } from '@/composables/useStudioToast'

const props = defineProps<{ section: Section }>()
const studio = useStudioStore()

// ─── Édition en place de l'en-tête (sur-titre / titre / description) ───────────
// Débounce type « bloc Titre » : une rafale de frappe = un seul point d'annulation.
type HeaderField = 'kicker' | 'title' | 'description'
const pendingHeader: Partial<Record<HeaderField, string>> = {}
let headerTimer: ReturnType<typeof setTimeout> | null = null

function flushHeader() {
  if (headerTimer) {
    clearTimeout(headerTimer)
    headerTimer = null
  }
  const keys = Object.keys(pendingHeader) as HeaderField[]
  if (keys.length === 0) return
  const patch: Partial<Record<HeaderField, string | undefined>> = {}
  for (const key of keys) {
    patch[key] = (pendingHeader[key] ?? '').trim() || undefined
    delete pendingHeader[key]
  }
  studio.updateSection(props.section.id, patch)
}

function setHeaderField(key: HeaderField, value: string) {
  pendingHeader[key] = value
  if (headerTimer) clearTimeout(headerTimer)
  headerTimer = setTimeout(flushHeader, 350)
}

onBeforeUnmount(flushHeader)

// Monter/descendre sélectionne la section : la barre d'outils reste visible même
// quand la section glisse hors du curseur, ce qui permet d'enchaîner les clics ↑/↓.
function moveSection(dir: -1 | 1) {
  studio.selectSection(props.section.id)
  studio.moveSectionInFlow(props.section.id, dir)
}

function onSectionClick(event: MouseEvent) {
  if (studio.isPreview) return
  const target = event.target as HTMLElement | null
  if (!target) return
  // Un clic dans un bloc enfant ou dans la barre d'outils garde son propre comportement.
  if (target.closest('[data-block-index]') || target.closest('[data-section-toolbar]')) return
  studio.selectSection(props.section.id)
}

const zoneId = computed(() => `${props.section.id}-0`)

const { show } = useStudioToast()
function removeSection() {
  studio.removeSection(props.section.id)
  show(isSurvey.value ? 'Étape supprimée' : 'Section supprimée', 'Annuler', () => studio.undo())
}

// Sondage : chaque section racine est une « étape » numérotée.
const isSurvey = computed(() => studio.content?.type === 'survey')
const stepInfo = computed(() => {
  if (!isSurvey.value) return null
  const roots = studio.currentPageCanvasItems.filter((i) => i.section).map((i) => i.section!.id)
  const n = roots.indexOf(props.section.id)
  return n >= 0 ? { n: n + 1, total: roots.length } : null
})

// « + Ajouter un bloc » en pied de zone → popover d'insertion en fin de zone.
const addEndBtn = ref<HTMLElement | null>(null)
const addEndOpen = ref(false)
const zoneLength = computed(() => (studio.blocksByZone[zoneId.value] ?? []).length)

const resolveOpts = {
  tokenMap: () => studio.pageParams,
  datasetId: () => undefined,
  readonly: () => false,
  docSlug: () => studio.content?.slug,
}
const { text: kicker } = useResolvedTokens({ raw: () => props.section.kicker, ...resolveOpts })
const { text: title } = useResolvedTokens({ raw: () => props.section.title, ...resolveOpts })
const { text: description } = useResolvedTokens({ raw: () => props.section.description, ...resolveOpts })

const kickerHtml = computed(() => sanitizeInlineHtml(kicker.value))
const titleHtml = computed(() => sanitizeInlineHtml(title.value))
const descriptionHtml = computed(() => sanitizeInlineHtml(description.value))

const headStyle = computed(() => ({
  ...(props.section.headerLetterSpacing != null ? { '--sec-head-ls': `${props.section.headerLetterSpacing}em` } : {}),
  ...(props.section.headerLineHeight != null ? { '--sec-head-lh': String(props.section.headerLineHeight) } : {}),
}))

const hasKicker = computed(() => !isBlankInlineHtml(props.section.kicker))
const hasTitle = computed(() => !isBlankInlineHtml(props.section.title))
const hasDescription = computed(() => !isBlankInlineHtml(props.section.description))
const hasHeader = computed(() => hasKicker.value || hasTitle.value || hasDescription.value)
const theme = computed(() => props.section.theme ?? 'default')
const dark = computed(() => theme.value === 'dark')
// StatsData : section = carte (blocs nus à l'intérieur), comme la page publiée.
// Article : flux éditorial à nu — le cadre est porté par le bloc « StatsData lié »,
// pas par la section. `carded` reste vrai pour que les blocs ne prennent pas une
// seconde carte (`flat`).
const carded = computed(() => true)
const boxed = computed(() => carded.value && theme.value === 'default' && studio.content?.type !== 'article')

// Aperçu WYSIWYG : les blocs enfants savent s'ils sont dans une carte sombre / sans carte.
// Objet à accesseurs → `BlockWrapper` lit toujours la valeur réactive courante.
provide(SECTION_CONTEXT, {
  get dark() { return dark.value },
  get carded() { return carded.value },
})
</script>

<template>
  <div
    :data-section-id="section.id"
    class="group/section relative"
    :class="[
      studio.isPreview ? '' : 'pt-9',
      section.locked ? 'cursor-not-allowed' : (studio.isPreview ? '' : 'cursor-pointer'),
    ]"
    @click="onSectionClick"
  >
    <!-- Barre d'outils de section -->
    <div
      v-if="!section.locked && !studio.isPreview"
      data-section-toolbar
      class="absolute left-0 right-0 top-0 z-30 flex h-8 items-center justify-between opacity-0 transition-opacity group-hover/section:opacity-100"
      :class="studio.selectedSectionId === section.id ? 'opacity-100' : ''"
    >
      <div
        class="section-drag-handle flex h-7 cursor-grab items-center gap-1.5 rounded-[3px] border-2 border-[var(--ds-divide)] bg-[var(--ds-surface)] px-2 active:cursor-grabbing"
        title="Glisser pour réordonner"
      >
        <StudioIcon name="grip" :size="13" class="text-[var(--ds-muted)]" />
        <span class="st-lbl !text-[10px]">{{ isSurvey ? 'Étape' : 'Section' }}</span>
      </div>

      <div class="st-b-tools !static !flex" role="toolbar" :aria-label="isSurvey ? 'Actions de l’étape' : 'Actions de la section'">
        <button type="button" title="Réglages" aria-label="Réglages" @click.stop="studio.selectSection(section.id)">
          <StudioIcon name="gear" :size="15" />
        </button>
        <button type="button" title="Monter" aria-label="Monter" @click.stop="moveSection(-1)">
          <StudioIcon name="up" :size="15" />
        </button>
        <button type="button" title="Descendre" aria-label="Descendre" @click.stop="moveSection(1)">
          <StudioIcon name="down" :size="15" />
        </button>
        <button type="button" title="Dupliquer" aria-label="Dupliquer" @click.stop="studio.duplicateSection(section.id)">
          <StudioIcon name="dup" :size="15" />
        </button>
        <button type="button" title="Supprimer" aria-label="Supprimer" @click.stop="removeSection">
          <StudioIcon name="trash" :size="15" />
        </button>
      </div>
    </div>

    <!-- Badge verrouillé -->
    <div
      v-if="section.locked && !studio.isPreview"
      class="st-notice mb-2 !py-1.5"
    >
      <StudioIcon name="lock" :size="14" />
      <span>Section verrouillée</span>
    </div>

    <!-- Section : carte sur un StatsData, flux nu sur un article -->
    <div
      class="sd-sec"
      :class="{
        'sd-sec--card': boxed,
        'sd-sec--accent': theme === 'accent',
        'sd-sec--dark': dark,
        'outline outline-2 outline-offset-[6px] outline-[var(--ds-blue-500)]': studio.selectedSectionId === section.id && !studio.isPreview,
      }"
    >
      <!-- Édition : en-tête toujours présent, éditable en place -->
      <div
        v-if="!studio.isPreview"
        class="sd-sec__head st-sec-h"
        :class="{ 'sd-sec__head--empty': !hasHeader, 'is-sel': studio.selectedSectionId === section.id }"
        :style="headStyle"
        @focusout="flushHeader"
      >
        <p v-if="stepInfo" class="sd-sec__kicker !flex items-center gap-2">
          <StudioIcon name="choice" :size="13" />Étape {{ stepInfo.n }} sur {{ stepInfo.total }}
        </p>
        <SectionInlineText
          v-else
          class="sd-sec__kicker"
          :section-id="section.id"
          field="kicker"
          :model-value="section.kicker ?? ''"
          placeholder="Sur-titre"
          @update:model-value="setHeaderField('kicker', $event)"
        />
        <SectionInlineText
          class="sd-sec__title"
          :section-id="section.id"
          field="title"
          :model-value="section.title ?? ''"
          placeholder="Titre de la section"
          @update:model-value="setHeaderField('title', $event)"
        />
        <SectionInlineText
          class="sd-sec__desc"
          :section-id="section.id"
          field="description"
          :model-value="section.description ?? ''"
          placeholder="Description (optionnelle)"
          @update:model-value="setHeaderField('description', $event)"
        />
      </div>

      <!-- Rendu : en-tête affiché seulement si renseigné -->
      <div v-else-if="hasHeader" class="sd-sec__head" :style="headStyle">
        <p v-if="hasKicker" class="sd-sec__kicker" v-html="kickerHtml" />
        <h2 v-if="hasTitle" class="sd-sec__title" v-html="titleHtml" />
        <p v-if="hasDescription" class="sd-sec__desc" v-html="descriptionHtml" />
      </div>

      <CanvasZone :zone-id="zoneId" :col-index="0" />

      <div v-if="!studio.isPreview && !section.locked && zoneLength > 0" class="mt-1 flex justify-center">
        <button
          ref="addEndBtn"
          type="button"
          class="st-add-ghost"
          :aria-expanded="addEndOpen"
          @click.stop="addEndOpen = !addEndOpen"
        >
          <StudioIcon name="plus" :size="14" />Ajouter un bloc
        </button>
        <BlockInsertPopover
          v-if="addEndOpen && addEndBtn"
          :anchor="addEndBtn"
          :zone-id="zoneId"
          :index="zoneLength"
          @close="addEndOpen = false"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* En-tête encore vierge : discret tant qu'on ne le survole pas / édite pas. */
.sd-sec__head--empty {
  opacity: 0.65;
  transition: opacity 0.15s ease;
}
.sd-sec__head--empty:hover,
.sd-sec__head--empty:focus-within {
  opacity: 1;
}
</style>

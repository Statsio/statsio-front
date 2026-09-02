<script setup lang="ts">
import { computed, provide, onBeforeUnmount } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useResolvedTokens } from '@/composables/useResolvedTokens'
import { sanitizeInlineHtml, isBlankInlineHtml } from '@/lib/inline-rich-text'
import type { Section } from '@/types/studio'
import CanvasZone from './CanvasZone.vue'
import SectionInlineText from './SectionInlineText.vue'
import { SECTION_CONTEXT } from './section-context'

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
// Toute section est une carte (fond blanc + blocs « nus » à l'intérieur), avec ou
// sans en-tête — même rendu dans l'éditeur et sur la page publiée.
const carded = computed(() => true)

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
        class="section-drag-handle flex cursor-grab items-center gap-1 rounded-lg border border-[var(--studio-line)] bg-white px-2 py-1 shadow-[var(--studio-shadow-card)] hover:bg-[var(--studio-wash)] active:cursor-grabbing"
        title="Réordonner cette section"
      >
        <svg class="h-3.5 w-3.5 text-[var(--studio-faint)]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
        </svg>
        <span class="text-[10px] font-medium text-[var(--studio-muted)]">Section</span>
      </div>

      <div
        class="flex items-center gap-0.5 rounded-[10px] border border-[var(--studio-line)] bg-white p-1 shadow-[var(--studio-shadow-card)]"
      >
        <button
          type="button"
          class="flex h-[26px] w-7 items-center justify-center rounded-[7px] text-[13px] hover:bg-[var(--studio-wash)]"
          :class="studio.selectedSectionId === section.id ? 'text-[var(--color-primary)]' : 'text-[var(--studio-muted)]'"
          title="Réglages de la section"
          @click.stop="studio.selectSection(section.id)"
        >⚙</button>
        <button
          type="button"
          class="flex h-[26px] w-7 items-center justify-center rounded-[7px] text-[13px] text-[var(--studio-muted)] hover:bg-[var(--studio-wash)]"
          title="Monter"
          @click.stop="moveSection(-1)"
        >↑</button>
        <button
          type="button"
          class="flex h-[26px] w-7 items-center justify-center rounded-[7px] text-[13px] text-[var(--studio-muted)] hover:bg-[var(--studio-wash)]"
          title="Descendre"
          @click.stop="moveSection(1)"
        >↓</button>
        <button
          type="button"
          class="flex h-[26px] w-7 items-center justify-center rounded-[7px] text-[13px] text-[var(--studio-muted)] hover:bg-[var(--studio-wash)]"
          title="Dupliquer cette section"
          @click.stop="studio.duplicateSection(section.id)"
        >⧉</button>
        <button
          type="button"
          class="flex h-[26px] w-7 items-center justify-center rounded-[7px] text-[13px] text-[var(--studio-muted)] hover:bg-[var(--studio-wash)] hover:text-[var(--color-error)]"
          title="Supprimer cette section"
          @click.stop="studio.removeSection(section.id)"
        >🗑</button>
      </div>
    </div>

    <!-- Badge verrouillé -->
    <div
      v-if="section.locked && !studio.isPreview"
      class="mb-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5"
    >
      <svg class="h-3.5 w-3.5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
      <span class="text-[11px] font-semibold text-amber-700">Section verrouillée</span>
    </div>

    <!-- La section = une carte (comme au rendu public) -->
    <div
      class="sd-sec"
      :class="{
        'sd-sec--card': carded && theme === 'default',
        'sd-sec--accent': theme === 'accent',
        'sd-sec--dark': dark,
        'outline outline-2 outline-offset-4 outline-[var(--color-primary)] rounded-[18px]': studio.selectedSectionId === section.id && !studio.isPreview,
      }"
    >
      <!-- Édition : en-tête toujours présent, éditable en place -->
      <div
        v-if="!studio.isPreview"
        class="sd-sec__head"
        :class="{ 'sd-sec__head--empty': !hasHeader }"
        :style="headStyle"
        @focusout="flushHeader"
      >
        <SectionInlineText
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

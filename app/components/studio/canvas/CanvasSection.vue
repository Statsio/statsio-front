<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useResolvedTokens } from '@/composables/useResolvedTokens'
import { SECTION_LAYOUT_DEFINITIONS } from '@/types/studio'
import type { Section, SectionLayout } from '@/types/studio'
import CanvasZone from './CanvasZone.vue'
import { SECTION_CONTEXT } from './section-context'

const props = defineProps<{ section: Section }>()
const studio = useStudioStore()

const showLayoutMenu = ref(false)

const def = computed(
  () => SECTION_LAYOUT_DEFINITIONS.find((d) => d.type === props.section.layout)!,
)

const zoneIds = computed(() =>
  Array.from({ length: def.value.cols }, (_, i) => `${props.section.id}-${i}`),
)

const resolveOpts = {
  tokenMap: () => studio.pageParams,
  datasetId: () => undefined,
  readonly: () => false,
  docSlug: () => studio.content?.slug,
}
const { text: kicker } = useResolvedTokens({ raw: () => props.section.kicker, ...resolveOpts })
const { text: title } = useResolvedTokens({ raw: () => props.section.title, ...resolveOpts })
const { text: description } = useResolvedTokens({ raw: () => props.section.description, ...resolveOpts })

const hasHeader = computed(() => Boolean(props.section.kicker || props.section.title || props.section.description))
const theme = computed(() => props.section.theme ?? 'default')
const dark = computed(() => theme.value === 'dark')
const carded = computed(() => hasHeader.value || theme.value !== 'default')

// Aperçu WYSIWYG : les blocs enfants savent s'ils sont dans une carte sombre / sans carte.
// Objet à accesseurs → `BlockWrapper` lit toujours la valeur réactive courante.
provide(SECTION_CONTEXT, {
  get dark() { return dark.value },
  get carded() { return carded.value },
})

function changeLayout(layout: SectionLayout) {
  studio.changeSectionLayout(props.section.id, layout)
  showLayoutMenu.value = false
}
</script>

<template>
  <div
    class="group/section relative"
    :class="[studio.isPreview ? '' : 'pt-9', section.locked ? 'cursor-not-allowed' : '']"
  >
    <!-- Barre d'outils de section -->
    <div
      v-if="!section.locked && !studio.isPreview"
      class="absolute left-0 right-0 top-0 z-30 flex h-8 items-center justify-between opacity-0 transition-opacity group-hover/section:opacity-100"
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

      <div class="flex items-center gap-1">
        <button
          class="flex h-6 items-center gap-1 rounded-lg border bg-white px-2 py-1 text-[10px] font-medium shadow-[var(--studio-shadow-card)] transition-colors"
          :class="studio.selectedSectionId === section.id
            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
            : 'border-[var(--studio-line)] text-[var(--studio-muted)] hover:bg-[var(--studio-wash)]'"
          title="Réglages de la section"
          @click.stop="studio.selectSection(section.id)"
        >
          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </button>
        <div class="relative">
          <button
            class="flex items-center gap-1 rounded-lg border border-[var(--studio-line)] bg-white px-2 py-1 text-[10px] font-medium text-[var(--studio-muted)] shadow-[var(--studio-shadow-card)] hover:bg-[var(--studio-wash)]"
            @click.stop="showLayoutMenu = !showLayoutMenu"
          >
            {{ def.label }}
          </button>
          <div
            v-if="showLayoutMenu"
            class="absolute right-0 top-7 z-40 w-52 rounded-xl border border-[var(--studio-line)] bg-white p-1.5 shadow-[var(--studio-shadow-pop)]"
            @click.stop
          >
            <button
              v-for="ld in SECTION_LAYOUT_DEFINITIONS"
              :key="ld.type"
              class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-[var(--studio-wash)]"
              :class="ld.type === section.layout ? 'bg-[var(--studio-accent-wash)] font-semibold text-[var(--color-primary)]' : 'text-[var(--studio-ink)]'"
              @click="changeLayout(ld.type)"
            >
              <span class="flex h-3.5 w-16 shrink-0 gap-0.5">
                <span
                  v-for="(span, i) in ld.gridCols"
                  :key="i"
                  class="rounded-[2px] bg-[var(--color-secondary)]"
                  :style="{ flex: span }"
                />
              </span>
              {{ ld.label }}
            </button>
          </div>
        </div>

        <button
          class="flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--studio-line)] bg-white text-[var(--studio-faint)] shadow-[var(--studio-shadow-card)] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-[var(--color-error)]"
          title="Supprimer cette section"
          @click.stop="studio.removeSection(section.id)"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
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
      <div v-if="hasHeader" class="sd-sec__head">
        <p v-if="section.kicker" class="sd-sec__kicker">{{ kicker }}</p>
        <h2 v-if="section.title" class="sd-sec__title">{{ title }}</h2>
        <p v-if="section.description" class="sd-sec__desc">{{ description }}</p>
      </div>

      <div
        class="grid items-start gap-4"
        :style="{ gridTemplateColumns: def.gridCols.map((s: number) => `${s}fr`).join(' ') }"
      >
        <CanvasZone v-for="(zoneId, i) in zoneIds" :key="zoneId" :zone-id="zoneId" :col-index="i" />
      </div>
    </div>
  </div>

  <div v-if="showLayoutMenu" class="fixed inset-0 z-20" @click="showLayoutMenu = false" />
</template>

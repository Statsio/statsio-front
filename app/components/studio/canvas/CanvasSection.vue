<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { SECTION_LAYOUT_DEFINITIONS } from '@/types/studio'
import type { Section, SectionLayout } from '@/types/studio'
import CanvasZone from './CanvasZone.vue'

const props = defineProps<{ section: Section }>()
const studio = useStudioStore()

const showLayoutMenu = ref(false)

const def = computed(
  () => SECTION_LAYOUT_DEFINITIONS.find((d) => d.type === props.section.layout)!,
)

const zoneIds = computed(() =>
  Array.from({ length: def.value.cols }, (_, i) => `${props.section.id}-${i}`),
)

function changeLayout(layout: SectionLayout) {
  studio.changeSectionLayout(props.section.id, layout)
  showLayoutMenu.value = false
}
</script>

<template>
  <div
    class="group/section relative"
    :class="[studio.isPreview ? '' : 'pt-8', section.locked ? 'cursor-not-allowed' : '']"
  >
    <!-- Section toolbar -->
    <div
      v-if="!section.locked && !studio.isPreview"
      class="absolute left-0 right-0 top-0 z-10 flex h-8 items-center justify-between opacity-0 transition-opacity group-hover/section:opacity-100"
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
        <div class="relative">
          <button
            class="flex items-center gap-1 rounded-lg border border-[var(--studio-line)] bg-white px-2 py-1 text-[10px] font-medium text-[var(--studio-muted)] shadow-[var(--studio-shadow-card)] hover:bg-[var(--studio-wash)]"
            @click.stop="showLayoutMenu = !showLayoutMenu"
          >
            {{ def.label }}
          </button>
          <div
            v-if="showLayoutMenu"
            class="absolute right-0 top-7 z-30 w-52 rounded-xl border border-[var(--studio-line)] bg-white p-1.5 shadow-[var(--studio-shadow-pop)]"
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

    <!-- Locked badge -->
    <div
      v-if="section.locked && !studio.isPreview"
      class="mb-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5"
    >
      <svg class="h-3.5 w-3.5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
      <span class="text-[11px] font-semibold text-amber-700">Section verrouillée</span>
    </div>

    <!-- Columns -->
    <div
      class="grid items-start gap-3.5"
      :style="{ gridTemplateColumns: def.gridCols.map((s: number) => `${s}fr`).join(' ') }"
    >
      <CanvasZone v-for="(zoneId, i) in zoneIds" :key="zoneId" :zone-id="zoneId" :col-index="i" />
    </div>
  </div>

  <div v-if="showLayoutMenu" class="fixed inset-0 z-20" @click="showLayoutMenu = false" />
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { computed } from 'vue'
import type { StudioBlock } from '@/types/studio-document'

const props = defineProps<{
  modelValue: StudioBlock[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [StudioBlock[]]
  select: [id: string]
}>()

const list = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const typeLabel: Record<StudioBlock['type'], string> = {
  text_heading: 'Titre',
  text_paragraph: 'Paragraphe',
  layout_2col: 'Layout (2 colonnes)',
  layout_3col: 'Layout (3 colonnes)',
  chart: 'Graphique',
  chart_line: 'Graphique (ligne)',
  chart_pie: 'Graphique (camembert)',
  chart_donut: 'Graphique (donut)',
  table: 'Tableau',
  kpi: 'KPI',
  callout: 'Encadré',
  divider: 'Séparateur',
  image: 'Image',
}

const preview = (b: StudioBlock) => {
  switch (b.type) {
    case 'text_heading':
      return b.text
    case 'text_paragraph':
      return b.text.slice(0, 48) + (b.text.length > 48 ? '…' : '')
    case 'layout_2col':
    case 'layout_3col':
      return `${b.columns?.reduce((s, c) => s + (Array.isArray(c) ? c.length : 0), 0) ?? 0} blocs`
    case 'chart':
    case 'chart_line':
    case 'chart_pie':
    case 'chart_donut':
      return b.caption
    case 'table':
      return b.caption
    case 'kpi':
      return `${b.label}: ${b.value}`.trim()
    case 'callout':
      return b.title
    case 'divider':
      return '—'
    case 'image':
      return b.alt
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <p class="text-xs leading-relaxed text-slate-500">
      Glissez pour réordonner. Cliquez pour sélectionner sur la page.
    </p>
    <draggable
      v-model="list"
      item-key="id"
      handle=".outline-drag-handle"
      class="flex flex-col gap-2"
      ghost-class="studio-dnd-ghost"
    >
      <template #item="{ element }">
        <div
          role="button"
          tabindex="0"
          class="flex items-center gap-2 rounded-2xl border px-2 py-2 text-left transition motion-reduce:transition-none"
          :class="
            element.id === selectedId
              ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          "
          @click="emit('select', element.id)"
          @keydown.enter.prevent="emit('select', element.id)"
        >
          <button
            type="button"
            class="outline-drag-handle flex h-9 w-8 shrink-0 cursor-grab items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Déplacer"
            @click.stop
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9" cy="7" r="1.25" />
              <circle cx="15" cy="7" r="1.25" />
              <circle cx="9" cy="12" r="1.25" />
              <circle cx="15" cy="12" r="1.25" />
              <circle cx="9" cy="17" r="1.25" />
              <circle cx="15" cy="17" r="1.25" />
            </svg>
          </button>
          <div class="min-w-0 flex-1">
            <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {{ typeLabel[element.type as keyof typeof typeLabel] }}
            </p>
            <p class="truncate text-sm text-slate-800">{{ preview(element) }}</p>
          </div>
        </div>
      </template>
    </draggable>
  </div>
</template>

<style scoped>
:deep(.studio-dnd-ghost) {
  opacity: 0.65;
}
</style>

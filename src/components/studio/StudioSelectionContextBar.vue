<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock, StudioTextStyle } from '@/types/studio-document'
import { ref } from 'vue'
import AppColorPickerModal from '@/components/ui/AppColorPickerModal.vue'
import AppSelect from '@/components/ui/AppSelect.vue'

const props = defineProps<{
  block: StudioBlock
}>()

const emit = defineEmits<{
  'update-block': [StudioBlock]
}>()

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

const isTextBlock = computed(() => props.block.type === 'text_heading' || props.block.type === 'text_paragraph')

const currentStyle = computed<StudioTextStyle>(() => {
  if (!isTextBlock.value) return {}
  return (((props.block as unknown as { style?: StudioTextStyle }).style ?? {}) as StudioTextStyle) || {}
})

const patchTextStyle = (patch: Partial<StudioTextStyle>) => {
  if (!isTextBlock.value) return
  const b = props.block as Extract<StudioBlock, { type: 'text_heading' | 'text_paragraph' }>
  emit('update-block', { ...b, style: { ...(b.style ?? {}), ...patch } })
}

const toggleStyleFlag = (k: 'underline' | 'strike' | 'italic') => {
  const cur = !!currentStyle.value[k]
  patchTextStyle({ [k]: !cur } as Partial<StudioTextStyle>)
}

const align = computed(() => currentStyle.value.align ?? 'left')

const fontOptions = [
  { id: '', label: 'Défaut' },
  { id: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif', label: 'Sans' },
  { id: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif', label: 'Serif' },
  { id: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', label: 'Mono' },
] as const

const weightOptions = [
  { id: 300, label: 'Light' },
  { id: 400, label: 'Regular' },
  { id: 500, label: 'Medium' },
  { id: 600, label: 'Semi-bold' },
  { id: 700, label: 'Bold' },
  { id: 800, label: 'Extra-bold' },
] as const

const fontFamilySelectOptions = computed(() => fontOptions.map((o) => ({ value: o.id, label: o.label })))
const fontWeightSelectOptions = computed(() => [{ value: '', label: 'Poids' }, ...weightOptions.map((o) => ({ value: String(o.id), label: o.label }))])

const colorModalOpen = ref(false)
const highlightModalOpen = ref(false)
</script>

<template>
  <div
    class="relative z-[10000] flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur-sm sm:px-6"
    role="region"
    aria-label="Bloc sélectionné"
  >
    <div class="flex min-w-0 items-center gap-2">
      <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {{ typeLabel[block.type] }}
      </span>
      <span class="truncate text-sm text-slate-700">
        <template v-if="isTextBlock">Mise en forme rapide du texte (couleur, alignement, style…)</template>
        <template v-else>Bloc sélectionné — le panneau de propriétés s’ouvre à gauche.</template>
      </span>
    </div>
    <div class="flex shrink-0 flex-wrap gap-2">
      <div
        v-if="isTextBlock"
        class="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1"
        aria-label="Mise en forme texte"
      >
        <AppSelect
          :model-value="currentStyle.fontFamily ?? ''"
          :options="fontFamilySelectOptions"
          size="sm"
          button-class="h-8 border-transparent bg-transparent px-2 font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0 focus:ring-0"
          panel-class="mt-1"
          @change="(v) => patchTextStyle({ fontFamily: String(v || '') || undefined })"
        />

        <AppSelect
          :model-value="currentStyle.fontWeight != null ? String(currentStyle.fontWeight) : ''"
          :options="fontWeightSelectOptions"
          size="sm"
          button-class="h-8 border-transparent bg-transparent px-2 font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0 focus:ring-0"
          panel-class="mt-1"
          @change="(v) => patchTextStyle({ fontWeight: String(v || '') ? Number(v) : undefined })"
        />

        <button
          type="button"
          class="inline-flex h-8 items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label="Choisir la couleur du texte"
          @click="colorModalOpen = true"
        >
          <span class="h-5 w-5 rounded-full border border-slate-200" :style="{ backgroundColor: currentStyle.color ?? '#111827' }" />
          Couleur
        </button>

        <button
          type="button"
          class="inline-flex h-8 items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label="Choisir la couleur de surlignage"
          @click="highlightModalOpen = true"
        >
          <span
            class="h-5 w-5 rounded-full border border-slate-200"
            :style="{ backgroundColor: currentStyle.highlight ?? '#ffffff' }"
          />
          Surlignage
        </button>

        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          :class="currentStyle.italic ? 'bg-slate-50' : 'bg-white'"
          aria-label="Italique"
          @click="toggleStyleFlag('italic')"
        >
          <FontAwesomeIcon icon="fa-solid fa-italic" class="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          :class="currentStyle.underline ? 'bg-slate-50' : 'bg-white'"
          aria-label="Souligné"
          @click="toggleStyleFlag('underline')"
        >
          <FontAwesomeIcon icon="fa-solid fa-underline" class="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          :class="currentStyle.strike ? 'bg-slate-50' : 'bg-white'"
          aria-label="Barré"
          @click="toggleStyleFlag('strike')"
        >
          <FontAwesomeIcon icon="fa-solid fa-strikethrough" class="h-3.5 w-3.5" />
        </button>

        <div class="flex items-center overflow-hidden rounded-full border border-slate-200 bg-white">
          <button
            type="button"
            class="inline-flex h-8 w-9 items-center justify-center text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            :class="align === 'left' ? 'bg-slate-50 text-slate-900' : ''"
            aria-label="Aligner à gauche"
            @click="patchTextStyle({ align: 'left' })"
          >
            <FontAwesomeIcon icon="fa-solid fa-align-left" class="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            class="inline-flex h-8 w-9 items-center justify-center text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            :class="align === 'center' ? 'bg-slate-50 text-slate-900' : ''"
            aria-label="Centrer"
            @click="patchTextStyle({ align: 'center' })"
          >
            <FontAwesomeIcon icon="fa-solid fa-align-center" class="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            class="inline-flex h-8 w-9 items-center justify-center text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            :class="align === 'right' ? 'bg-slate-50 text-slate-900' : ''"
            aria-label="Aligner à droite"
            @click="patchTextStyle({ align: 'right' })"
          >
            <FontAwesomeIcon icon="fa-solid fa-align-right" class="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            class="inline-flex h-8 w-9 items-center justify-center text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            :class="align === 'justify' ? 'bg-slate-50 text-slate-900' : ''"
            aria-label="Justifier"
            @click="patchTextStyle({ align: 'justify' })"
          >
            <FontAwesomeIcon icon="fa-solid fa-align-justify" class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

    </div>
  </div>

  <AppColorPickerModal
    v-model="colorModalOpen"
    title="Couleur du texte"
    :value="currentStyle.color ?? '#111827'"
    @apply="patchTextStyle({ color: $event ?? undefined })"
  />
  <AppColorPickerModal
    v-model="highlightModalOpen"
    title="Surlignage"
    :value="currentStyle.highlight ?? '#ffffff'"
    @apply="patchTextStyle({ highlight: $event ?? undefined })"
  />
</template>

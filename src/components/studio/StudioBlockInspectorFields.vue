<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock, StudioBlockPayload } from '@/types/studio-document'
import { mergeBlockWithPayload } from '@/types/studio-document'
import type { StudioBlockDataBinding, StudioDataSource } from '@/types/studio-data-source'
import { sourceToTabular } from '@/types/studio-data-source'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{
  selectedBlock: StudioBlock
  dataSources: StudioDataSource[]
  /** Préfixe pour éviter les doublons d’id accessibilité */
  idPrefix?: string
  /** Panneau intégré (pas de bordure haute : le parent encadre la zone) */
  embedded?: boolean
}>()

const emit = defineEmits<{
  'update-block': [StudioBlock]
  'remove-block': [id: string]
  'duplicate-block': [id: string]
}>()

const p = computed(() => props.idPrefix ?? 'studio-inspector')

const typeLabel: Record<StudioBlock['type'], string> = {
  text_heading: 'Titre',
  text_paragraph: 'Paragraphe',
  chart: 'Graphique',
  table: 'Tableau',
  image: 'Image',
}

const pushPayload = (payload: StudioBlockPayload) => {
  emit('update-block', mergeBlockWithPayload(props.selectedBlock.id, payload))
}

const headingText = computed({
  get: () => (props.selectedBlock.type === 'text_heading' ? props.selectedBlock.text : ''),
  set: (v) => {
    if (props.selectedBlock.type === 'text_heading') pushPayload({ type: 'text_heading', text: v })
  },
})

const paragraphText = computed({
  get: () => (props.selectedBlock.type === 'text_paragraph' ? props.selectedBlock.text : ''),
  set: (v) => {
    if (props.selectedBlock.type === 'text_paragraph') pushPayload({ type: 'text_paragraph', text: v })
  },
})

const chartCaption = computed({
  get: () => (props.selectedBlock.type === 'chart' ? props.selectedBlock.caption : ''),
  set: (v) => {
    if (props.selectedBlock.type === 'chart') {
      pushPayload({
        type: 'chart',
        caption: v,
        dataBinding: { ...props.selectedBlock.dataBinding },
      })
    }
  },
})

const tableCaption = computed({
  get: () => (props.selectedBlock.type === 'table' ? props.selectedBlock.caption : ''),
  set: (v) => {
    if (props.selectedBlock.type === 'table') {
      pushPayload({
        type: 'table',
        caption: v,
        dataBinding: { ...props.selectedBlock.dataBinding },
      })
    }
  },
})

const imageAlt = computed({
  get: () => (props.selectedBlock.type === 'image' ? props.selectedBlock.alt : ''),
  set: (v) => {
    if (props.selectedBlock.type === 'image') pushPayload({ type: 'image', alt: v })
  },
})

const bindingSourceHeaders = computed(() => {
  const b = props.selectedBlock
  if (b.type !== 'chart' && b.type !== 'table') return [] as string[]
  const src = props.dataSources.find((s) => s.id === b.dataBinding.sourceId)
  if (!src) return []
  return sourceToTabular(src).headers
})

const patchDataBinding = (partial: Partial<StudioBlockDataBinding>) => {
  const b = props.selectedBlock
  if (b.type !== 'chart' && b.type !== 'table') return
  const nextBinding: StudioBlockDataBinding = { ...b.dataBinding, ...partial }
  if (b.type === 'chart') {
    pushPayload({ type: 'chart', caption: b.caption, dataBinding: nextBinding })
  } else {
    pushPayload({ type: 'table', caption: b.caption, dataBinding: nextBinding })
  }
}

const isTableColumnVisible = (header: string) => {
  const b = props.selectedBlock
  if (b.type !== 'table') return false
  const keys = b.dataBinding.visibleColumnKeys
  if (keys.length === 0) return true
  return keys.includes(header)
}

const toggleTableColumn = (header: string, checked: boolean) => {
  const b = props.selectedBlock
  if (b.type !== 'table') return
  const headers = bindingSourceHeaders.value
  let keys = [...b.dataBinding.visibleColumnKeys]
  if (keys.length === 0) keys = [...headers]
  if (checked) {
    if (!keys.includes(header)) keys.push(header)
  } else {
    keys = keys.filter((k) => k !== header)
  }
  const allIncluded = headers.length > 0 && headers.every((h) => keys.includes(h))
  if (allIncluded || keys.length === 0) keys = []
  patchDataBinding({ visibleColumnKeys: keys })
}
</script>

<template>
  <section
    class="rounded-2xl"
    :class="embedded ? 'pt-0' : 'border-t border-slate-100 pt-4'"
    :aria-labelledby="`${p}-block-h`"
  >
    <h2 :id="`${p}-block-h`" class="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
      Propriétés du bloc
    </h2>
    <p class="mb-4 text-sm font-semibold text-slate-900">{{ typeLabel[selectedBlock.type] }}</p>

    <div class="flex flex-col gap-4">
      <template v-if="selectedBlock.type === 'text_heading'">
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`${p}-h`">Texte du titre</label>
          <input
            :id="`${p}-h`"
            v-model="headingText"
            type="text"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
            autocomplete="off"
          />
        </div>
      </template>

      <template v-else-if="selectedBlock.type === 'text_paragraph'">
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`${p}-para`">Texte</label>
          <textarea
            :id="`${p}-para`"
            v-model="paragraphText"
            rows="6"
            class="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm leading-relaxed text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
          />
        </div>
      </template>

      <template v-else-if="selectedBlock.type === 'chart'">
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`${p}-chart-cap`">Légende</label>
          <input
            :id="`${p}-chart-cap`"
            v-model="chartCaption"
            type="text"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
            autocomplete="off"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`${p}-chart-src`">Source de données</label>
          <select
            :id="`${p}-chart-src`"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
            :value="selectedBlock.dataBinding.sourceId"
            @change="patchDataBinding({ sourceId: ($event.target as HTMLSelectElement).value })"
          >
            <option value="">— Choisir une source —</option>
            <option v-for="s in dataSources" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <template v-if="bindingSourceHeaders.length">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`${p}-chart-cat`">Champ des étiquettes</label>
            <select
              :id="`${p}-chart-cat`"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
              :value="selectedBlock.dataBinding.chartCategoryKey"
              @change="patchDataBinding({ chartCategoryKey: ($event.target as HTMLSelectElement).value })"
            >
              <option value="">— Auto (1re colonne) —</option>
              <option v-for="h in bindingSourceHeaders" :key="h" :value="h">{{ h }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`${p}-chart-val`">Champ des valeurs</label>
            <select
              :id="`${p}-chart-val`"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
              :value="selectedBlock.dataBinding.chartValueKey"
              @change="patchDataBinding({ chartValueKey: ($event.target as HTMLSelectElement).value })"
            >
              <option value="">— Auto (2e colonne) —</option>
              <option v-for="h in bindingSourceHeaders" :key="'v-' + h" :value="h">{{ h }}</option>
            </select>
          </div>
        </template>
        <p v-else-if="selectedBlock.dataBinding.sourceId" class="text-xs text-amber-700">
          Cette source ne contient pas encore de colonnes exploitables.
        </p>
      </template>

      <template v-else-if="selectedBlock.type === 'table'">
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`${p}-tbl-cap`">Titre du tableau</label>
          <input
            :id="`${p}-tbl-cap`"
            v-model="tableCaption"
            type="text"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
            autocomplete="off"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`${p}-tbl-src`">Source de données</label>
          <select
            :id="`${p}-tbl-src`"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
            :value="selectedBlock.dataBinding.sourceId"
            @change="patchDataBinding({ sourceId: ($event.target as HTMLSelectElement).value })"
          >
            <option value="">— Choisir une source —</option>
            <option v-for="s in dataSources" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div v-if="bindingSourceHeaders.length">
          <p class="mb-2 text-xs font-semibold text-slate-600">Colonnes visibles</p>
          <p class="mb-2 text-[11px] leading-snug text-slate-500">Tout cocher = toutes les colonnes.</p>
          <ul class="flex flex-col gap-2">
            <li v-for="h in bindingSourceHeaders" :key="h" class="flex items-center gap-2">
              <input
                :id="`${p}-col-${h}`"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                :checked="isTableColumnVisible(h)"
                @change="toggleTableColumn(h, ($event.target as HTMLInputElement).checked)"
              />
              <label :for="`${p}-col-${h}`" class="text-sm text-slate-800">{{ h }}</label>
            </li>
          </ul>
        </div>
        <p v-else-if="selectedBlock.dataBinding.sourceId" class="text-xs text-amber-700">
          Cette source ne contient pas encore de colonnes.
        </p>
      </template>

      <template v-else-if="selectedBlock.type === 'image'">
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`${p}-img`">Texte alternatif</label>
          <input
            :id="`${p}-img`"
            v-model="imageAlt"
            type="text"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
            autocomplete="off"
          />
        </div>
      </template>

      <div class="flex flex-wrap gap-2 pt-1">
        <AppButton variant="secondary" size="md" type="button" @click="emit('duplicate-block', selectedBlock.id)">
          Dupliquer
        </AppButton>
        <AppButton
          variant="outline"
          size="md"
          type="button"
          class="text-rose-700 hover:border-rose-200 hover:bg-rose-50"
          @click="emit('remove-block', selectedBlock.id)"
        >
          Supprimer
        </AppButton>
      </div>
    </div>
  </section>
</template>

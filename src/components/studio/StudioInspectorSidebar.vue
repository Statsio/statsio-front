<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock, StudioBlockPayload, StudioDocumentSettings } from '@/types/studio-document'
import { mergeBlockWithPayload } from '@/types/studio-document'
import AppButton from '@/components/ui/AppButton.vue'

const settingsModel = defineModel<StudioDocumentSettings>('settings', { required: true })

const props = defineProps<{
  selectedBlock: StudioBlock | null
}>()

const emit = defineEmits<{
  'update:block': [StudioBlock]
  'remove-block': [id: string]
  'duplicate-block': [id: string]
}>()

const typeLabel: Record<StudioBlock['type'], string> = {
  text_heading: 'Titre',
  text_paragraph: 'Paragraphe',
  chart: 'Graphique',
  table: 'Tableau',
  image: 'Image',
}

const pushPayload = (payload: StudioBlockPayload) => {
  if (!props.selectedBlock) return
  emit('update:block', mergeBlockWithPayload(props.selectedBlock.id, payload))
}

const headingText = computed({
  get: () => (props.selectedBlock?.type === 'text_heading' ? props.selectedBlock.text : ''),
  set: (v) => {
    if (props.selectedBlock?.type === 'text_heading') pushPayload({ type: 'text_heading', text: v })
  },
})

const paragraphText = computed({
  get: () => (props.selectedBlock?.type === 'text_paragraph' ? props.selectedBlock.text : ''),
  set: (v) => {
    if (props.selectedBlock?.type === 'text_paragraph') pushPayload({ type: 'text_paragraph', text: v })
  },
})

const chartCaption = computed({
  get: () => (props.selectedBlock?.type === 'chart' ? props.selectedBlock.caption : ''),
  set: (v) => {
    if (props.selectedBlock?.type === 'chart') pushPayload({ type: 'chart', caption: v })
  },
})

const tableCaption = computed({
  get: () => (props.selectedBlock?.type === 'table' ? props.selectedBlock.caption : ''),
  set: (v) => {
    if (props.selectedBlock?.type === 'table') pushPayload({ type: 'table', caption: v })
  },
})

const imageAlt = computed({
  get: () => (props.selectedBlock?.type === 'image' ? props.selectedBlock.alt : ''),
  set: (v) => {
    if (props.selectedBlock?.type === 'image') pushPayload({ type: 'image', alt: v })
  },
})
</script>

<template>
  <aside
    class="flex w-full max-w-full shrink-0 flex-col border-t border-slate-200 bg-white/95 lg:w-[min(22rem,100%)] lg:border-l lg:border-t-0 lg:border-slate-200"
    aria-label="Paramètres et propriétés"
  >
    <div class="flex max-h-[min(50vh,28rem)] flex-1 flex-col gap-6 overflow-y-auto p-4 lg:max-h-none lg:p-5">
      <section aria-labelledby="inspector-doc-heading">
        <h2 id="inspector-doc-heading" class="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Paramètres du document
        </h2>
        <div class="flex flex-col gap-3">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600" for="inspector-subtitle">Sous-titre</label>
            <input
              id="inspector-subtitle"
              v-model="settingsModel.subtitle"
              type="text"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
              placeholder="Accroche courte"
              autocomplete="off"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600" for="inspector-visibility">Visibilité</label>
            <select
              id="inspector-visibility"
              v-model="settingsModel.visibility"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
            >
              <option value="private">Privé</option>
              <option value="team">Équipe</option>
              <option value="public">Public</option>
            </select>
          </div>
        </div>
      </section>

      <section v-if="selectedBlock" aria-labelledby="inspector-block-heading" class="border-t border-slate-100 pt-6">
        <h2 id="inspector-block-heading" class="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Bloc sélectionné
        </h2>
        <p class="mb-4 text-sm font-semibold text-slate-900">{{ typeLabel[selectedBlock.type] }}</p>

        <div class="flex flex-col gap-4">
          <template v-if="selectedBlock.type === 'text_heading'">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600" for="inspector-h">Texte du titre</label>
              <input
                id="inspector-h"
                v-model="headingText"
                type="text"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
                autocomplete="off"
              />
            </div>
          </template>

          <template v-else-if="selectedBlock.type === 'text_paragraph'">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600" for="inspector-p">Texte</label>
              <textarea
                id="inspector-p"
                v-model="paragraphText"
                rows="6"
                class="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm leading-relaxed text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
              />
            </div>
          </template>

          <template v-else-if="selectedBlock.type === 'chart'">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600" for="inspector-chart">Légende</label>
              <input
                id="inspector-chart"
                v-model="chartCaption"
                type="text"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
                autocomplete="off"
              />
            </div>
          </template>

          <template v-else-if="selectedBlock.type === 'table'">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600" for="inspector-table">Titre du tableau</label>
              <input
                id="inspector-table"
                v-model="tableCaption"
                type="text"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
                autocomplete="off"
              />
            </div>
          </template>

          <template v-else-if="selectedBlock.type === 'image'">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600" for="inspector-img">Texte alternatif</label>
              <input
                id="inspector-img"
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
            <AppButton variant="outline" size="md" type="button" class="text-rose-700 hover:border-rose-200 hover:bg-rose-50" @click="emit('remove-block', selectedBlock.id)">
              Supprimer
            </AppButton>
          </div>
        </div>
      </section>

      <section v-else class="border-t border-slate-100 pt-6">
        <p class="text-sm leading-relaxed text-slate-500">
          Cliquez sur un bloc dans la page pour modifier son contenu ici.
        </p>
      </section>
    </div>
  </aside>
</template>

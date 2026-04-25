<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock, StudioBlockPayload, StudioTextStyle } from '@/types/studio-document'
import AppSelect from '@/components/ui/AppSelect.vue'

const props = defineProps<{
  block: Extract<StudioBlock, { type: 'link' | 'link_button' | 'link_back' }>
  idPrefix: string
  pages?: Array<{ id: string; name: string }>
}>()

const emit = defineEmits<{
  'push-payload': [StudioBlockPayload]
}>()

const linkTypeOptions = [
  { value: 'url', label: 'URL externe' },
  { value: 'page', label: 'Page interne' },
]

const linkType = computed(() => {
  return props.block.targetPageId ? 'page' : 'url'
})

const pageOptions = computed(() => {
  return (props.pages ?? []).map((p) => ({ value: p.id, label: p.name }))
})

const colorOptions = [
  { value: '#111827', label: 'Gris foncé' },
  { value: '#2563eb', label: 'Bleu' },
  { value: '#dc2626', label: 'Rouge' },
  { value: '#16a34a', label: 'Vert' },
  { value: '#ea580c', label: 'Orange' },
  { value: '#9333ea', label: 'Violet' },
  { value: '#64748b', label: 'Gris' },
  { value: '#ffffff', label: 'Blanc' },
]

const highlightOptions = [
  { value: '', label: 'Aucun' },
  { value: '#2563eb', label: 'Bleu' },
  { value: '#dc2626', label: 'Rouge' },
  { value: '#16a34a', label: 'Vert' },
  { value: '#ea580c', label: 'Orange' },
  { value: '#9333ea', label: 'Violet' },
  { value: '#64748b', label: 'Gris' },
  { value: '#fef08a', label: 'Jaune' },
]

const patchStyle = (patch: Partial<StudioTextStyle>) => {
  const style = { ...(props.block.style ?? {}), ...patch }
  emit('push-payload', {
    type: props.block.type,
    label: props.block.label,
    url: props.block.url,
    ...(props.block.targetPageId ? { targetPageId: props.block.targetPageId } : {}),
    style,
  })
}

const setLinkType = (type: string) => {
  if (type === 'page') {
    const firstPageId = pageOptions.value[0]?.value ?? ''
    emit('push-payload', {
      type: props.block.type,
      label: props.block.label,
      url: '',
      targetPageId: firstPageId,
      ...(props.block.style ? { style: { ...props.block.style } } : {}),
    })
  } else {
    emit('push-payload', {
      type: props.block.type,
      label: props.block.label,
      url: props.block.url,
      ...(props.block.style ? { style: { ...props.block.style } } : {}),
    })
  }
}

const setUrl = (url: string) => {
  emit('push-payload', {
    type: props.block.type,
    label: props.block.label,
    url,
    ...(props.block.style ? { style: { ...props.block.style } } : {}),
  })
}

const setTargetPage = (pageId: string) => {
  emit('push-payload', {
    type: props.block.type,
    label: props.block.label,
    url: '',
    targetPageId: pageId,
    ...(props.block.style ? { style: { ...props.block.style } } : {}),
  })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <section class="space-y-3">
      <h3 class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Destination</h3>
      <div class="h-px bg-slate-100" />

      <div>
        <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`${idPrefix}-link-type`">Type de lien</label>
        <AppSelect
          :id="`${idPrefix}-link-type`"
          :model-value="linkType"
          :options="linkTypeOptions"
          size="md"
          button-class="rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:ring-2 focus:ring-primary/20"
          panel-class="mt-1"
          aria-label="Type de lien"
          @change="(v) => setLinkType(String(v))"
        />
      </div>

      <div v-if="linkType === 'url'">
        <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`${idPrefix}-url`">URL</label>
        <input
          :id="`${idPrefix}-url`"
          :value="block.url"
          type="text"
          class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
          placeholder="https://example.com"
          @input="setUrl(($event.target as HTMLInputElement).value)"
        />
      </div>

      <div v-else-if="linkType === 'page' && pageOptions.length">
        <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`${idPrefix}-page`">Page</label>
        <AppSelect
          :id="`${idPrefix}-page`"
          :model-value="block.targetPageId ?? ''"
          :options="pageOptions"
          size="md"
          button-class="rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:ring-2 focus:ring-primary/20"
          panel-class="mt-1"
          aria-label="Page cible"
          @change="(v) => setTargetPage(String(v))"
        />
      </div>
    </section>

    <section class="space-y-3">
      <h3 class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Style</h3>
      <div class="h-px bg-slate-100" />

      <div>
        <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`${idPrefix}-color`">Couleur du texte</label>
        <AppSelect
          :id="`${idPrefix}-color`"
          :model-value="block.style?.color ?? '#2563eb'"
          :options="colorOptions"
          size="md"
          button-class="rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:ring-2 focus:ring-primary/20"
          panel-class="mt-1"
          aria-label="Couleur du texte"
          @change="(v) => patchStyle({ color: String(v) })"
        />
      </div>

      <div v-if="block.type === 'link_button'">
        <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`${idPrefix}-bg`">Couleur de fond</label>
        <AppSelect
          :id="`${idPrefix}-bg`"
          :model-value="block.style?.highlight ?? '#2563eb'"
          :options="highlightOptions.filter(o => o.value !== '')"
          size="md"
          button-class="rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:ring-2 focus:ring-primary/20"
          panel-class="mt-1"
          aria-label="Couleur de fond"
          @change="(v) => patchStyle({ highlight: String(v) })"
        />
      </div>

      <div class="flex items-center gap-2">
        <input
          :id="`${idPrefix}-underline`"
          type="checkbox"
          :checked="block.style?.underline ?? false"
          class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary/20"
          @change="patchStyle({ underline: ($event.target as HTMLInputElement).checked })"
        />
        <label :for="`${idPrefix}-underline`" class="text-xs font-semibold text-slate-600">Souligné</label>
      </div>
    </section>
  </div>
</template>

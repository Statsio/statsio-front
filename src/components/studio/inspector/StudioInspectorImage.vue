<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock, StudioBlockPayload } from '@/types/studio-document'

const props = defineProps<{
  block: Extract<StudioBlock, { type: 'image' }>
  idPrefix: string
}>()

const emit = defineEmits<{
  'push-payload': [StudioBlockPayload]
}>()

const imageAlt = computed({
  get: () => props.block.alt,
  set: (v) => emit('push-payload', { type: 'image', alt: v }),
})
</script>

<template>
  <div class="space-y-6">
    <section class="space-y-3">
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Configuration Image
        </label>
        <div class="h-px bg-slate-100 mb-2" />
        
        <label class="mb-1.5 block text-xs font-semibold text-slate-600" :for="`${idPrefix}-img`">
          Texte alternatif (Accessibilité)
        </label>
        <input
          :id="`${idPrefix}-img`"
          v-model="imageAlt"
          type="text"
          class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20"
          placeholder="Décrivez l'image..."
          autocomplete="off"
        />
      </div>
    </section>

    <!-- Section pour l'upload d'image à venir -->
    <section class="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
      <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Source Image
      </p>
      <p class="mt-2 text-xs text-slate-500">
        L'upload direct sera bientôt disponible.
      </p>
    </section>
  </div>
</template>


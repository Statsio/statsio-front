<script setup lang="ts">
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{
  show: boolean
  block: StudioBlock
  columnGroups: { label: string; datasetId: string; columns: string[] }[]
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const studio = useStudioStore()

const urlParams = computed<string[]>(() => props.block.fieldMapping.urlParams ?? [])

function toggle(col: string) {
  const current = urlParams.value
  const updated = current.includes(col) ? current.filter(c => c !== col) : [...current, col]
  studio.updateBlockFieldMapping(props.block.id, { urlParams: updated.length ? updated : undefined })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="emit('close')" />
      <div class="relative z-10 w-full max-w-xl flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" style="max-height: min(85vh, 560px);">

        <!-- Header -->
        <div class="flex items-center justify-between shrink-0 border-b border-slate-100 px-5 py-3.5">
          <div class="flex items-center gap-3">
            <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
            </span>
            <h3 class="text-[13px] font-semibold text-slate-800">Paramètres URL</h3>
            <span v-if="urlParams.length" class="min-w-4 h-4 px-1 rounded-full bg-violet-500 text-white text-[9px] flex items-center justify-center font-bold">{{ urlParams.length }}</span>
          </div>
          <button class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" @click="emit('close')">×</button>
        </div>

        <!-- Description -->
        <div class="shrink-0 border-b border-slate-100 px-5 py-3 bg-slate-50/60">
          <p class="text-[11px] text-slate-500 leading-relaxed">
            Colonnes passées dans l'URL lors d'une sélection (<code class="font-mono bg-white border border-slate-200 px-1 rounded text-slate-600 text-[10px]">?col=valeur</code>) pour générer des liens partageables vers la page template.
          </p>
        </div>

        <!-- Groups -->
        <div class="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          <div v-for="group in columnGroups" :key="group.datasetId" class="flex flex-col gap-2">
            <p class="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">{{ group.label }}</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="col in group.columns" :key="col"
                class="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium font-mono transition-all"
                :class="urlParams.includes(col)
                  ? 'bg-violet-50 border-violet-300 text-violet-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50/60 hover:text-violet-700'"
                @click="toggle(col)"
              >
                <svg v-if="urlParams.includes(col)" class="w-3 h-3 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <svg v-else class="w-3 h-3 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                {{ col }}
              </button>
            </div>
          </div>
          <p v-if="columnGroups.length === 0" class="text-xs text-slate-400 text-center py-4 italic">Aucune colonne disponible. Configurez d'abord les sources de recherche.</p>
        </div>

        <!-- Preview + footer -->
        <div class="shrink-0 border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-4">
          <div v-if="urlParams.length" class="flex-1 min-w-0">
            <p class="text-[10px] font-mono text-slate-400 truncate">?{{ urlParams.map(c => c + '=…').join('&amp;') }}</p>
          </div>
          <div v-else class="flex-1" />
          <button class="shrink-0 rounded-xl bg-violet-500 px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity" @click="emit('close')">Terminé</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

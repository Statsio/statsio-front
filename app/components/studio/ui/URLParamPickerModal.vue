<script setup lang="ts">
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock } from '@/types/studio'
import StudioSubModal from './StudioSubModal.vue'

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
  <StudioSubModal
    v-if="show"
    title="Paramètres d'URL"
    subtitle="Colonnes ajoutées à l'URL lors d'une sélection (?col=valeur), pour générer des liens partageables vers la page template."
    :width="580"
    @close="emit('close')"
  >
        <!-- Groups -->
        <div class="flex flex-col gap-5">
          <div v-for="group in columnGroups" :key="group.datasetId" class="flex flex-col gap-2">
            <p class="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--studio-faint)]">{{ group.label }}</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="col in group.columns" :key="col"
                class="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium font-mono transition-all"
                :class="urlParams.includes(col)
                  ? 'bg-violet-50 border-violet-300 text-violet-700'
                  : 'bg-white border-[var(--studio-line-strong)] text-[var(--studio-muted)] hover:border-violet-300 hover:bg-violet-50/60 hover:text-violet-700'"
                @click="toggle(col)"
              >
                <svg v-if="urlParams.includes(col)" class="w-3 h-3 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <svg v-else class="w-3 h-3 text-[var(--studio-faint)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                {{ col }}
              </button>
            </div>
          </div>
          <p v-if="columnGroups.length === 0" class="text-xs text-[var(--studio-faint)] text-center py-4 italic">Aucune colonne disponible. Configurez d'abord les sources de recherche.</p>
        </div>

        <p v-if="urlParams.length" class="font-mono text-[11px] text-[var(--studio-faint)] truncate">
          Lien généré : ?{{ urlParams.map(c => c + '=…').join('&') }}
        </p>
  </StudioSubModal>
</template>

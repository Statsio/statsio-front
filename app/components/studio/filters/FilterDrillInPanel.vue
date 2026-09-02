<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useFilterDrillIn } from '@/composables/useFilterDrillIn'
import FilterSourceStep from './FilterSourceStep.vue'
import FilterColumnStep from './FilterColumnStep.vue'
import FilterValuesStep from './FilterValuesStep.vue'

const studio = useStudioStore()
const drillIn = useFilterDrillIn()
const { state } = drillIn

const block = computed(() => studio.selectedBlock)

const title = computed(() => {
  if (state.step === 'source') return 'Où se trouve la colonne ?'
  if (state.step === 'column') return 'Choisir une colonne'
  return 'Valeurs du filtre'
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    drillIn.close()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown, true))
</script>

<template>
  <div
    v-if="state.open && block"
    class="absolute inset-0 z-20 flex flex-col bg-[var(--studio-surface)]"
  >
    <!-- Header -->
    <div class="flex shrink-0 items-center gap-2 border-b border-[var(--studio-line)] px-3 py-2.5">
      <button
        type="button"
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--studio-muted)] transition-colors hover:bg-[var(--studio-wash)] hover:text-[var(--studio-ink)]"
        aria-label="Retour"
        @click="drillIn.goBack()"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>
      <p class="min-w-0 flex-1 truncate text-[13px] font-extrabold text-[var(--studio-ink)]">{{ title }}</p>
      <button
        type="button"
        class="shrink-0 text-[15px] leading-none text-[var(--studio-faint)] hover:text-[var(--studio-ink)]"
        aria-label="Fermer"
        @click="drillIn.close()"
      >✕</button>
    </div>

    <!-- Body -->
    <div class="min-h-0 flex-1 overflow-y-auto p-3">
      <FilterSourceStep v-if="state.step === 'source'" :block="block" />
      <FilterColumnStep v-else-if="state.step === 'column'" :block="block" />
      <FilterValuesStep v-else :block="block" />
    </div>

    <!-- Footer -->
    <div v-if="state.step === 'values'" class="shrink-0 border-t border-[var(--studio-line)] p-3">
      <button
        type="button"
        class="w-full rounded-xl py-2.5 text-[13px] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        :class="drillIn.canCommit() ? 'studio-gradient' : 'bg-[var(--studio-line-strong)]'"
        :disabled="!drillIn.canCommit()"
        @click="drillIn.commit()"
      >
        {{ state.editIndex != null ? 'Mettre à jour le filtre' : 'Appliquer le filtre' }}
      </button>
    </div>
  </div>
</template>

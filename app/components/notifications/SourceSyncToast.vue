<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'

const datasets = useStudioDatasetsStore()
const dismissed = ref(false)

const syncingDatasets = computed(() => datasets.datasets.filter((d) => d.status === 'pending'))

// Ré-affiche la popup si une nouvelle synchro démarre après que l'utilisateur ait fermé la précédente.
watch(
  () => syncingDatasets.value.length,
  (count, previousCount) => {
    if (count > 0 && previousCount === 0) dismissed.value = false
  },
)
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-2"
    leave-active-class="transition duration-150 ease-in"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="syncingDatasets.length && !dismissed"
      class="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden"
    >
      <div class="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-100">
        <p class="flex items-center gap-1.5 text-xs font-semibold text-slate-700 min-w-0">
          <svg class="w-3.5 h-3.5 shrink-0 animate-spin text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span class="truncate">Synchronisation en cours ({{ syncingDatasets.length }})</span>
        </p>
        <button
          class="shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Masquer"
          @click="dismissed = true"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="max-h-64 overflow-y-auto divide-y divide-slate-100">
        <div v-for="d in syncingDatasets" :key="d.id" class="px-3 py-2">
          <div class="flex items-center justify-between gap-2 mb-1">
            <p class="text-xs font-medium text-slate-700 truncate">{{ d.name }}</p>
            <span class="shrink-0 text-[10px] font-semibold text-slate-400">{{ d.progress ?? 0 }}%</span>
          </div>
          <div class="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              class="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500 ease-out"
              :style="{ width: `${d.progress ?? 0}%` }"
            />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { fetchDistinctValues } from '@/api/studio'
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock }>()

const studio = useStudioStore()

const query        = ref('')
const suggestions  = ref<string[]>([])
const isLoading    = ref(false)
const isOpen       = ref(false)
const inputRef     = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

const searchColumn = computed(() => props.block.fieldMapping.searchColumn)
const targetPageId = computed(() => props.block.fieldMapping.targetPageId)
const placeholder  = computed(() => props.block.config.searchPlaceholder || 'Rechercher…')
const isConfigured = computed(() => !!props.block.datasetId && !!searchColumn.value)

// Dropdown position (fixed, escapes overflow:hidden parents)
const dropdownStyle = ref({ top: '0px', left: '0px', width: '0px' })

function updateDropdownPosition() {
  const el = inputRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  dropdownStyle.value = {
    top:   `${rect.bottom + 4}px`,
    left:  `${rect.left}px`,
    width: `${rect.width}px`,
  }
}

// Debounced search — only fires when ≥2 chars
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function scheduleSearch(q: string) {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (q.length < 2) {
    suggestions.value = []
    isOpen.value = false
    isLoading.value = false
    return
  }
  isLoading.value = true
  isOpen.value = true
  debounceTimer = setTimeout(async () => {
    try {
      suggestions.value = await fetchDistinctValues(props.block.datasetId!, searchColumn.value!, q)
    } catch {
      suggestions.value = []
    } finally {
      isLoading.value = false
    }
  }, 250)
}

watch(query, (q) => {
  if (!isConfigured.value) return
  updateDropdownPosition()
  scheduleSearch(q)
})

// Reset when dataset/column changes
watch(
  [() => props.block.datasetId, searchColumn],
  () => { query.value = ''; suggestions.value = []; isOpen.value = false },
)

function onSelect(value: string) {
  query.value = value
  isOpen.value = false

  const targetPage = studio.pages.find((p) => p.id === targetPageId.value)
  if (targetPageId.value) studio.switchPage(targetPageId.value)
  if (targetPage?.paramName) studio.setPageParam(targetPage.paramName, value)
}

function onFocus() {
  if (!isConfigured.value) return
  updateDropdownPosition()
  if (query.value.length >= 2) isOpen.value = true
}

function handleOutsideClick(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick)
  window.addEventListener('scroll', updateDropdownPosition, true)
  window.addEventListener('resize', updateDropdownPosition)
})
onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  document.removeEventListener('mousedown', handleOutsideClick)
  window.removeEventListener('scroll', updateDropdownPosition, true)
  window.removeEventListener('resize', updateDropdownPosition)
})
</script>

<template>
  <div class="h-full flex flex-col justify-center p-4">
    <!-- Not configured -->
    <div v-if="!isConfigured" class="flex flex-col items-center justify-center gap-2 text-slate-400 h-full">
      <svg class="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <span class="text-xs">Configurer la source et la colonne →</span>
    </div>

    <!-- Search UI -->
    <div v-else ref="containerRef" class="relative w-full">
      <div class="relative">
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          :placeholder="placeholder"
          class="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors"
          @focus="onFocus"
        />
        <svg
          v-if="isLoading"
          class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin"
          fill="none" viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>

      <!-- Hint -->
      <p v-if="query.length > 0 && query.length < 2" class="mt-1 text-[11px] text-slate-400 pl-1">
        Tapez au moins 2 caractères…
      </p>

      <!-- Dropdown via Teleport to escape overflow:hidden -->
      <Teleport to="body">
        <div
          v-if="isOpen && suggestions.length > 0"
          class="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl max-h-56 overflow-y-auto"
          :style="dropdownStyle"
        >
          <button
            v-for="value in suggestions"
            :key="value"
            type="button"
            class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[var(--color-primary)] transition-colors first:rounded-t-lg last:rounded-b-lg"
            @mousedown.prevent="onSelect(value)"
          >
            {{ value }}
          </button>
        </div>

        <div
          v-else-if="isOpen && !isLoading && query.length >= 2"
          class="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-sm px-4 py-3 text-sm text-slate-400"
          :style="dropdownStyle"
        >
          Aucun résultat pour « {{ query }} »
        </div>
      </Teleport>
    </div>
  </div>
</template>

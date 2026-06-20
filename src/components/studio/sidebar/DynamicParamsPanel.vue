<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'

const studio = useStudioStore()

const currentPage = computed(() => studio.pages.find((p) => p.id === studio.currentPageId))
const isTemplate  = computed(() => !!currentPage.value?.isTemplate)
const paramName   = computed(() => currentPage.value?.paramName)
const paramValue  = computed(() => paramName.value ? (studio.pageParams[paramName.value] ?? null) : null)
const token       = computed(() => paramName.value ? `{{${paramName.value}}}` : null)

async function copyToken() {
  if (!token.value) return
  try {
    await navigator.clipboard.writeText(token.value)
  } catch {
    // clipboard not available (insecure context)
  }
}
</script>

<template>
  <div v-if="isTemplate && token" class="border-t border-slate-100 bg-amber-50/60 px-4 py-3 shrink-0">
    <p class="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">Variables dynamiques</p>

    <div class="flex items-center justify-between gap-2 bg-white border border-amber-200 rounded-xl px-3 py-2">
      <div class="flex items-center gap-2 min-w-0">
        <svg class="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
        </svg>
        <code class="text-xs font-mono text-amber-800 truncate">{{ token }}</code>
      </div>

      <div class="flex items-center gap-1.5 shrink-0">
        <span v-if="paramValue" class="text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded font-medium max-w-[80px] truncate" :title="paramValue">
          = {{ paramValue }}
        </span>
        <button
          type="button"
          class="text-amber-500 hover:text-amber-700 transition-colors"
          title="Copier le token"
          @click="copyToken"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
          </svg>
        </button>
      </div>
    </div>

    <p class="text-[10px] text-amber-600 mt-1.5 leading-relaxed">
      Copiez ce token et collez-le dans la valeur d'un filtre de bloc pour le rendre dynamique.
    </p>
  </div>
</template>

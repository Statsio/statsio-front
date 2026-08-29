<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useResolvedTokenList } from '@/composables/useResolvedTokens'
import type { StudioBlock } from '@/types/studio'

/**
 * Grille compacte de paires libellé / valeur (bandeau méta du héro, encadré
 * méthodologie…). Les valeurs supportent les `{{jetons}}` et expressions.
 */
const props = defineProps<{ block: StudioBlock; readonly?: boolean; scope?: Record<string, string> }>()
const studio = useStudioStore()

const rawItems = computed(() => (props.block.config.fieldGridItems ?? []).filter((it) => it.label || it.value))
const cols = computed(() => props.block.config.fieldGridColumns ?? 3)

const { list: values } = useResolvedTokenList({
  items: () => rawItems.value.map((it) => it.value),
  tokenMap: () => ({ ...studio.pageParams, ...props.scope }),
  datasetId: () => props.block.datasetId,
  readonly: () => props.readonly ?? false,
  docSlug: () => studio.content?.slug,
})
</script>

<template>
  <div
    v-if="rawItems.length"
    class="grid gap-x-6 gap-y-4"
    :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
  >
    <div v-for="(it, i) in rawItems" :key="i" class="min-w-0">
      <div class="text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-[color:color-mix(in_srgb,var(--studio-ink)_45%,transparent)]">
        {{ it.label }}
      </div>
      <div class="mono mt-1.5 text-[13.5px] font-semibold text-[var(--studio-ink)] [overflow-wrap:anywhere]">
        {{ values[i] || it.value || '—' }}
      </div>
    </div>
  </div>
  <div v-else class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--studio-line-strong)] bg-[var(--studio-note)] py-8 text-[var(--studio-faint)]">
    <span class="text-xs">Ajouter des paires libellé / valeur →</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { SECTION_LAYOUT_DEFINITIONS } from '@/types/studio'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock }>()
const studio = useStudioStore()

const current = computed(() => props.block.config.layoutType ?? '2-cols')
</script>

<template>
  <div class="flex flex-col gap-2 px-4 pb-1 pt-3">
    <label class="text-xs font-semibold text-[var(--studio-muted)]">Agencement des colonnes</label>
    <div class="flex flex-col gap-1.5">
      <button
        v-for="ld in SECTION_LAYOUT_DEFINITIONS"
        :key="ld.type"
        type="button"
        class="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors"
        :class="current === ld.type ? 'cfg-active' : 'cfg-inactive'"
        @click="studio.changeBlockLayout(block.id, ld.type)"
      >
        <span class="flex h-3.5 w-16 shrink-0 gap-0.5">
          <span
            v-for="(span, i) in ld.gridCols"
            :key="i"
            class="rounded-[2px]"
            :class="current === ld.type ? 'bg-white' : 'bg-[var(--color-secondary)]'"
            :style="{ flex: span }"
          />
        </span>
        <span class="text-[12.5px] font-semibold">{{ ld.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.cfg-active { border-color: var(--studio-ink); background: var(--studio-ink); color: #fff; }
.cfg-inactive { border-color: var(--studio-line-strong); color: color-mix(in srgb, var(--studio-ink) 70%, transparent); }
.cfg-inactive:hover { border-color: var(--color-primary); }
</style>

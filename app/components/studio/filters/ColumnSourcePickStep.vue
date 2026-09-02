<script setup lang="ts">
import { computed } from 'vue'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { blockColumnGroups } from '@/lib/studio-columns'
import type { StudioBlock } from '@/types/studio'

const props = withDefaults(
  defineProps<{ block: StudioBlock; selectedSourceId?: string | null; hint?: string }>(),
  { selectedSourceId: null, hint: 'Le bloc lit plusieurs sources. Choisissez celle qui contient la colonne.' },
)

const emit = defineEmits<{ pick: [sourceId: string] }>()

const datasets = useStudioDatasetsStore()
const groups = computed(() => blockColumnGroups(props.block, datasets))
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <p class="mb-1 text-[12px] leading-[1.5] text-[var(--studio-faint)]">{{ hint }}</p>
    <button
      v-for="g in groups"
      :key="g.sourceId ?? g.label"
      type="button"
      class="flex items-center justify-between gap-3 rounded-xl border-[1.5px] px-3.5 py-3 text-left transition-colors"
      :class="selectedSourceId === g.sourceId
        ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)]'
        : 'border-[var(--studio-line-strong)] hover:border-[var(--color-primary)]'"
      @click="emit('pick', g.sourceId ?? '')"
    >
      <span class="flex min-w-0 flex-col gap-0.5">
        <span class="truncate text-[13px] font-bold text-[var(--studio-ink)]">{{ g.label }}</span>
        <span class="text-[11px] text-[var(--studio-faint)]">
          {{ g.columns.length }} colonne{{ g.columns.length > 1 ? 's' : '' }}
        </span>
      </span>
      <span
        v-if="g.isPrimary"
        class="shrink-0 rounded-[5px] bg-[var(--studio-tag)] px-[7px] py-[3px] font-mono text-[9.5px] font-semibold text-[var(--studio-tag-ink)]"
      >principale</span>
    </button>
  </div>
</template>

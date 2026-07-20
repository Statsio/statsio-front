<script setup lang="ts">
import { computed } from 'vue'

export interface RankingItem {
  key: string | number
  to?: string
  label: string
  valueLabel: string
  value: number
  leading?: string
  imageUrl?: string | null
}

const props = defineProps<{
  items: RankingItem[]
}>()

const maxValue = computed(() => Math.max(...props.items.map((i) => i.value), 1))
</script>

<template>
  <div>
    <component
      :is="item.to ? 'NuxtLink' : 'div'"
      v-for="item in items"
      :key="item.key"
      :to="item.to"
      class="flex items-center gap-3.5 border-t border-slate-100 py-2.5 first:border-t-0"
    >
      <span
        v-if="item.imageUrl || item.leading"
        class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-slate-50 text-[14px]"
      >
        <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.label" class="h-full w-full object-cover" />
        <span v-else aria-hidden="true">{{ item.leading }}</span>
      </span>
      <span class="w-32 shrink-0 truncate text-[13.5px] font-bold text-slate-900 md:w-40">{{ item.label }}</span>
      <span class="h-2 flex-1 overflow-hidden rounded bg-slate-100">
        <span
          class="block h-full rounded bg-[var(--color-primary)]"
          :style="{ width: `${Math.max(8, (item.value / maxValue) * 100)}%` }"
        />
      </span>
      <span class="mono w-20 shrink-0 text-right text-[13px] font-bold text-slate-900">{{ item.valueLabel }}</span>
    </component>
  </div>
</template>

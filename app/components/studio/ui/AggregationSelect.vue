<script setup lang="ts">
import type { AggregateFunction } from '@/types/studio'

defineProps<{ modelValue?: AggregateFunction }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: AggregateFunction | undefined): void }>()

const OPTIONS: { v: AggregateFunction | undefined; l: string; desc: string }[] = [
  { v: undefined, l: '—',   desc: 'Aucune' },
  { v: 'sum',     l: 'Σ',   desc: 'Somme' },
  { v: 'avg',     l: 'x̄',  desc: 'Moyenne' },
  { v: 'count',   l: '#',   desc: 'Compte' },
  { v: 'min',     l: '↓',   desc: 'Min' },
  { v: 'max',     l: '↑',   desc: 'Max' },
]
</script>

<template>
  <div class="grid grid-cols-3 gap-1.5">
    <button
      v-for="opt in OPTIONS" :key="opt.desc"
      type="button"
      class="flex flex-col items-center rounded-xl border px-2 py-2 transition-all"
      :class="(modelValue ?? undefined) === opt.v
        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
      @click="emit('update:modelValue', opt.v)"
    >
      <span class="text-base font-bold">{{ opt.l }}</span>
      <span class="mt-0.5 text-[10px] opacity-70">{{ opt.desc }}</span>
    </button>
  </div>
</template>

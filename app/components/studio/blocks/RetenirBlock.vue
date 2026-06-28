<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

const retenirTitle = computed(() => props.block.config.retenirTitle || 'À retenir')
const items        = computed(() => props.block.config.retenirItems ?? [])
const color        = computed(() => props.block.config.retenirColor ?? 'violet')

const isEmpty = computed(() => items.value.length === 0)

const COLOR_MAP = {
  violet:  { border: 'border-[var(--color-primary)]', bg: 'bg-[var(--color-primary)]/5',  text: 'text-[var(--color-primary)]',  bullet: 'text-[var(--color-primary)]' },
  emerald: { border: 'border-emerald-500',             bg: 'bg-emerald-50',                 text: 'text-emerald-700',              bullet: 'text-emerald-500' },
  amber:   { border: 'border-amber-400',               bg: 'bg-amber-50',                   text: 'text-amber-700',                bullet: 'text-amber-500' },
  blue:    { border: 'border-blue-500',                bg: 'bg-blue-50',                    text: 'text-blue-700',                 bullet: 'text-blue-500' },
}

const colors = computed(() => COLOR_MAP[color.value] ?? COLOR_MAP.violet)
</script>

<template>
  <!-- Empty state -->
  <div
    v-if="isEmpty && !readonly"
    class="flex flex-col items-center justify-center gap-2 rounded-r-2xl border-l-4 border-slate-200 bg-slate-50 py-10 pl-5 text-slate-400"
  >
    <svg class="w-7 h-7 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z" />
    </svg>
    <span class="text-xs font-medium">Ajouter des points clés →</span>
  </div>

  <!-- Content -->
  <div
    v-else
    class="rounded-r-2xl border-l-4 p-5"
    :class="[colors.border, colors.bg]"
  >
    <p class="mb-3 text-[11px] font-bold uppercase tracking-[0.18em]" :class="colors.text">
      {{ retenirTitle }}
    </p>
    <ul class="flex flex-col gap-2">
      <li
        v-for="(item, i) in items"
        :key="i"
        class="flex gap-2 text-sm text-slate-700 leading-snug"
      >
        <span class="shrink-0 font-bold" :class="colors.bullet">•</span>
        <span>{{ item }}</span>
      </li>
    </ul>
  </div>
</template>

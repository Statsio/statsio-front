<script setup lang="ts">
import type { StudioPaletteItem } from '@/types/studio-document'

defineProps<{
  item: StudioPaletteItem
}>()

defineEmits<{
  add: []
}>()
</script>

<template>
  <div
    class="studio-drag-handle group flex cursor-grab items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left shadow-[0_12px_28px_-22px_rgba(15,23,42,0.35)] transition active:cursor-grabbing motion-reduce:transition-none hover:border-slate-300 hover:shadow-[0_18px_36px_-24px_rgba(15,23,42,0.4)]"
  >
    <span
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition group-hover:bg-slate-100 group-hover:text-slate-800"
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="7" r="1.5" />
        <circle cx="15" cy="7" r="1.5" />
        <circle cx="9" cy="12" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <circle cx="9" cy="17" r="1.5" />
        <circle cx="15" cy="17" r="1.5" />
      </svg>
    </span>
    <span class="min-w-0 flex-1">
      <span class="block text-sm font-semibold text-slate-950">{{ item.label }}</span>
      <span class="mt-0.5 block text-xs leading-snug text-slate-500">{{ item.description }}</span>
    </span>
    <button
      type="button"
      class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700 transition hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 motion-reduce:transition-none"
      @click.stop="$emit('add')"
    >
      Ajouter
    </button>
  </div>
</template>

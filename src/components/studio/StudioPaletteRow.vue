<script setup lang="ts">
import type { StudioPaletteItem } from '@/types/studio-document'

const props = defineProps<{
  item: StudioPaletteItem
}>()

defineEmits<{
  add: []
}>()

const illustrationByType: Partial<Record<StudioPaletteItem['blockType'], { bg: string; svg: string }>> = {
  text_heading: {
    bg: 'bg-slate-50',
    svg: `<svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="48" height="6" rx="3" fill="rgba(15,23,42,0.12)"/>
      <rect x="8" y="22" width="28" height="5" rx="2.5" fill="rgba(15,23,42,0.10)"/>
    </svg>`,
  },
  text_paragraph: {
    bg: 'bg-slate-50',
    svg: `<svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="44" height="5" rx="2.5" fill="rgba(15,23,42,0.10)"/>
      <rect x="8" y="19" width="48" height="5" rx="2.5" fill="rgba(15,23,42,0.10)"/>
      <rect x="8" y="28" width="40" height="5" rx="2.5" fill="rgba(15,23,42,0.10)"/>
    </svg>`,
  },
  table: {
    bg: 'bg-slate-50',
    svg: `<svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="44" height="28" rx="6" fill="rgba(15,23,42,0.06)"/>
      <path d="M10 18h44" stroke="rgba(15,23,42,0.18)" stroke-width="2"/>
      <path d="M10 26h44" stroke="rgba(15,23,42,0.14)" stroke-width="2"/>
      <path d="M24 10v28" stroke="rgba(15,23,42,0.12)" stroke-width="2"/>
      <path d="M38 10v28" stroke="rgba(15,23,42,0.12)" stroke-width="2"/>
    </svg>`,
  },
  chart: {
    bg: 'bg-slate-50',
    svg: `<svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="32" width="8" height="8" rx="2" fill="rgba(99,102,241,0.35)"/>
      <rect x="22" y="26" width="8" height="14" rx="2" fill="rgba(99,102,241,0.45)"/>
      <rect x="34" y="20" width="8" height="20" rx="2" fill="rgba(99,102,241,0.55)"/>
      <rect x="46" y="14" width="8" height="26" rx="2" fill="rgba(99,102,241,0.65)"/>
    </svg>`,
  },
  chart_line: {
    bg: 'bg-slate-50',
    svg: `<svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 34L22 26L34 30L46 18L54 22" stroke="rgba(99,102,241,0.75)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="22" cy="26" r="2.5" fill="rgba(99,102,241,0.9)"/>
      <circle cx="46" cy="18" r="2.5" fill="rgba(99,102,241,0.9)"/>
    </svg>`,
  },
  chart_pie: {
    bg: 'bg-slate-50',
    svg: `<svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 10a14 14 0 1 1-9.9 4.1L32 24V10Z" fill="rgba(99,102,241,0.65)"/>
      <path d="M32 10v14h14A14 14 0 0 0 32 10Z" fill="rgba(15,23,42,0.12)"/>
    </svg>`,
  },
  chart_donut: {
    bg: 'bg-slate-50',
    svg: `<svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="24" r="14" fill="rgba(99,102,241,0.20)"/>
      <path d="M32 10a14 14 0 1 1-9.9 4.1L32 24V10Z" fill="rgba(99,102,241,0.65)"/>
      <circle cx="32" cy="24" r="7" fill="white"/>
    </svg>`,
  },
  kpi: {
    bg: 'bg-slate-50',
    svg: `<svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="12" width="44" height="24" rx="10" fill="rgba(15,23,42,0.06)"/>
      <rect x="16" y="18" width="18" height="4" rx="2" fill="rgba(15,23,42,0.12)"/>
      <rect x="16" y="26" width="28" height="7" rx="3.5" fill="rgba(99,102,241,0.55)"/>
    </svg>`,
  },
  callout: {
    bg: 'bg-slate-50',
    svg: `<svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="12" width="44" height="24" rx="10" fill="rgba(14,165,233,0.15)"/>
      <rect x="16" y="18" width="22" height="4" rx="2" fill="rgba(15,23,42,0.14)"/>
      <rect x="16" y="25" width="32" height="4" rx="2" fill="rgba(15,23,42,0.10)"/>
    </svg>`,
  },
  divider: {
    bg: 'bg-slate-50',
    svg: `<svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="23" width="44" height="2.5" rx="1.25" fill="rgba(15,23,42,0.14)"/>
      <circle cx="32" cy="24" r="3" fill="rgba(15,23,42,0.08)"/>
    </svg>`,
  },
  image: {
    bg: 'bg-slate-50',
    svg: `<svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="12" width="44" height="24" rx="10" fill="rgba(15,23,42,0.06)"/>
      <circle cx="26" cy="22" r="3" fill="rgba(15,23,42,0.12)"/>
      <path d="M16 33l10-8 7 6 6-5 9 7H16Z" fill="rgba(99,102,241,0.35)"/>
    </svg>`,
  },
}

const illu = () => illustrationByType[props.item.blockType] ?? { bg: 'bg-slate-50', svg: illustrationByType.table!.svg }
</script>

<template>
  <div
    class="studio-drag-handle group relative flex cursor-grab flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-[0_12px_28px_-22px_rgba(15,23,42,0.35)] transition active:cursor-grabbing motion-reduce:transition-none hover:border-slate-300 hover:shadow-[0_18px_36px_-24px_rgba(15,23,42,0.4)]"
  >
    <div class="relative h-20 w-full" :class="illu().bg" aria-hidden="true">
      <div class="absolute inset-0 opacity-95" v-html="illu().svg" />
      <div class="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        Bloc
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-1.5 px-3 py-3">
      <span class="text-sm font-semibold text-slate-950">{{ item.label }}</span>
      <span class="text-xs leading-snug text-slate-500">{{ item.description }}</span>

      <div class="mt-2 flex items-center justify-between gap-2">
        <span class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Glisser</span>
        <button
          type="button"
          class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700 transition hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 motion-reduce:transition-none"
          @click.stop="$emit('add')"
        >
          Ajouter
        </button>
      </div>
    </div>
  </div>
</template>

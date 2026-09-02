<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useResolvedTokens, useResolvedTokenList } from '@/composables/useResolvedTokens'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; readonly?: boolean; scope?: Record<string, string> }>()
const studio = useStudioStore()

const rawItems = computed(() => props.block.config.retenirItems ?? [])
const color    = computed(() => props.block.config.retenirColor ?? 'violet')

const tokenMap = () => ({ ...studio.pageParams, ...props.scope })
const resolveOpts = {
  tokenMap,
  block: () => props.block,
  datasetId: () => props.block.datasetId,
  readonly: () => props.readonly ?? false,
  docSlug: () => studio.content?.slug,
}

const { text: retenirTitle } = useResolvedTokens({ raw: () => props.block.config.retenirTitle || 'À retenir', ...resolveOpts })
const { list: items } = useResolvedTokenList({ items: () => rawItems.value, ...resolveOpts })

const isEmpty = computed(() => rawItems.value.length === 0)

const COLOR_MAP = {
  violet:  { border: 'border-[color:color-mix(in_srgb,var(--color-primary)_25%,transparent)]', bg: 'bg-[var(--color-primary)]/5', text: 'text-[var(--color-primary)]', dot: 'bg-[var(--color-primary)]' },
  emerald: { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  amber:   { border: 'border-amber-200',   bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  blue:    { border: 'border-blue-200',    bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500' },
}

const colors = computed(() => COLOR_MAP[color.value] ?? COLOR_MAP.violet)
</script>

<template>
  <!-- Empty state -->
  <div
    v-if="isEmpty && !readonly"
    class="flex flex-col items-center justify-center gap-2 rounded-r-2xl border-l-4 border-[var(--studio-line)] bg-[var(--studio-note)] py-10 pl-5 text-[var(--studio-faint)]"
  >
    <svg class="w-7 h-7 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z" />
    </svg>
    <span class="text-xs font-medium">Ajouter des points clés →</span>
  </div>

  <!-- Content -->
  <div v-else>
    <p class="mb-3.5 text-[10px] font-extrabold uppercase tracking-[0.1em]" :class="colors.text">
      {{ retenirTitle }}
    </p>
    <ul class="flex flex-col gap-3.5">
      <li
        v-for="(item, i) in items"
        :key="i"
        class="grid grid-cols-[26px_1fr] items-start gap-[13px] text-[15px] leading-[1.55] text-[color:color-mix(in_srgb,var(--studio-ink)_80%,transparent)] [text-wrap:pretty]"
      >
        <span
          class="mono rounded-[7px] py-1 text-center text-[11px] font-semibold"
          :class="[colors.text, colors.bg]"
        >{{ String(i + 1).padStart(2, '0') }}</span>
        <span>{{ item }}</span>
      </li>
    </ul>
  </div>
</template>

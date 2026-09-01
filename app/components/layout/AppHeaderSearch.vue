<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** `bar` : pilule compacte du header (desktop). `block` : bouton pleine largeur (drawer mobile). */
    layout?: 'bar' | 'block'
    placeholder?: string
  }>(),
  {
    layout: 'bar',
    placeholder: 'Rechercher…',
  },
)

const emit = defineEmits<{ open: [] }>()

const isBar = computed(() => props.layout === 'bar')
</script>

<template>
  <button
    type="button"
    aria-label="Ouvrir la recherche"
    aria-haspopup="dialog"
    class="items-center gap-2.5 bg-slate-100 text-slate-400 transition hover:bg-slate-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    :class="
      isBar
        ? 'hidden rounded-[11px] px-3.5 py-2 md:flex md:w-[240px]'
        : 'flex w-full rounded-2xl px-4 py-3'
    "
    @click="emit('open')"
  >
    <svg viewBox="0 0 20 20" class="h-[15px] w-[15px] shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="9" cy="9" r="5.25" stroke="currentColor" stroke-width="1.7" />
      <path d="M13 13L17 17" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
    </svg>
    <span class="min-w-0 flex-1 truncate text-left text-[13px] font-medium text-slate-400">{{ props.placeholder }}</span>
    <kbd
      v-if="isBar"
      class="shrink-0 rounded-[5px] border border-slate-300/80 px-1.5 py-0.5 font-mono text-[9.5px] font-medium leading-none text-slate-400"
      aria-hidden="true"
    >
      /
    </kbd>
  </button>
</template>

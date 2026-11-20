<script setup lang="ts">
import { computed } from 'vue'
import DsKbd from '@/components/ds/DsKbd.vue'

/**
 * Déclencheur de recherche du header (charte Tranches) : champ bordé factice.
 * Le parent décide de la cible (modale globale ou recherche en page, cf.
 * useSearchTarget) — ce composant n'émet que `open`.
 */
const props = withDefaults(
  defineProps<{
    /** `bar` : champ compact du header (desktop). `block` : pleine largeur (drawer mobile). */
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
    class="ds-search-trigger items-center gap-2.5"
    :class="isBar ? 'is-bar hidden md:flex' : 'is-block flex w-full'"
    @click="emit('open')"
  >
    <svg viewBox="0 0 16 16" class="h-[15px] w-[15px] shrink-0" aria-hidden="true">
      <circle cx="7" cy="7" r="5.2" fill="none" stroke="currentColor" stroke-width="1.8" />
      <path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </svg>
    <span class="min-w-0 flex-1 truncate text-left">{{ props.placeholder }}</span>
    <DsKbd v-if="isBar" aria-hidden="true">/</DsKbd>
  </button>
</template>

<style scoped>
.ds-search-trigger {
  height: 36px;
  padding: 0 12px;
  border: 2px solid var(--ds-ol);
  border-radius: 3px;
  background: var(--ds-surface);
  color: var(--ds-muted);
  font: 500 14px var(--ds-ui);
  cursor: pointer;
  transition: background 0.15s;
}
.ds-search-trigger:hover {
  background: var(--ds-tint);
}
.ds-search-trigger:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 3px;
}
.ds-search-trigger svg {
  color: var(--ds-link);
}
.is-bar {
  width: 220px;
}
.is-block {
  height: 48px;
  box-shadow: 3px 3px 0 var(--ds-sh);
}
</style>

<script setup lang="ts">
/**
 * Pastille « À LA UNE » des contenus épinglés par l'admin (hors grande card
 * featured, qui porte déjà son propre badge). Style aligné sur celui des cards
 * featured : fond sombre, mono, lettrage espacé.
 */
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center rounded-[5px] bg-slate-950 font-mono font-semibold uppercase tracking-[0.1em] text-white"
    :class="compact ? 'px-1.5 py-0.5 text-[8.5px]' : 'px-2 py-1 text-[9.5px]'"
  >
    À la une
  </span>
</template>

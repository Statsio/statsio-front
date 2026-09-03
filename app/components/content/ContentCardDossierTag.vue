<script setup lang="ts">
import type { CatalogItem } from '@/types/catalog'

defineProps<{
  /** Dossier éditorial principal du contenu (payload du catalogue). */
  dossier: CatalogItem['dossier']
}>()

// Pas de destination pour le moment : simple repère visuel « ce contenu suit un dossier ».
</script>

<template>
  <span
    v-if="dossier"
    class="mb-[7px] inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border border-primary/15 bg-primary/[0.05] px-2 py-[3px] text-[10.5px] font-semibold text-primary"
  >
    <svg viewBox="0 0 24 24" class="h-3 w-3 shrink-0" fill="none" aria-hidden="true">
      <path
        d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2h7A1.5 1.5 0 0 1 19 9.5v7A1.5 1.5 0 0 1 17.5 18h-13A1.5 1.5 0 0 1 3 16.5v-9Z"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linejoin="round"
      />
    </svg>
    <span class="truncate">{{ dossier.name }}</span>
  </span>
</template>

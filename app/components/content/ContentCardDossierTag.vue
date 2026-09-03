<script setup lang="ts">
import type { CatalogItem } from '@/types/catalog'

defineProps<{
  /** Dossier éditorial principal du contenu (payload du catalogue). */
  dossier: CatalogItem['dossier']
}>()
</script>

<template>
  <NuxtLink
    v-if="dossier"
    :to="`/dossiers/${dossier.slug}`"
    :title="`Dossier : ${dossier.name}`"
    class="mb-[7px] inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border border-primary/15 bg-primary/[0.05] px-2 py-[3px] text-[10.5px] font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/10"
  >
    <AppIcon name="folder" :size="12" />
    <span class="min-w-0 truncate">{{ dossier.name }}</span>
  </NuxtLink>
</template>

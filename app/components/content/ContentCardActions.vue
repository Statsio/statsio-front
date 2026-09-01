<script setup lang="ts">
import type { ContentManageMeta } from '@/types/content-card'

defineProps<{
  manage: ContentManageMeta
  /** `row` : rendu compact sur une seule ligne. */
  compact?: boolean
}>()
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-2.5"
    :class="compact ? '' : 'mt-3.5 border-t border-slate-100 pt-3'"
  >
    <span
      class="rounded-full px-2.5 py-1 text-[10.5px] font-bold"
      :style="{ background: manage.statusBg, color: manage.statusColor }"
    >
      {{ manage.statusLabel }}
    </span>

    <NuxtLink :to="manage.studioPath" class="text-[12.5px] font-bold text-primary hover:text-accent">
      Studio
    </NuxtLink>

    <template v-if="manage.propertiesPath">
      <span class="text-slate-300">·</span>
      <NuxtLink :to="manage.propertiesPath" class="text-[12.5px] font-bold text-primary hover:text-accent">
        Propriétés
      </NuxtLink>
    </template>

    <span class="text-slate-300">·</span>
    <NuxtLink
      v-if="manage.publicPath"
      :to="manage.publicPath"
      class="text-[12.5px] font-bold text-primary hover:text-accent"
    >
      Voir en ligne
    </NuxtLink>
    <span v-else class="text-[12.5px] font-bold text-slate-300">Voir en ligne</span>
  </div>
</template>

<script setup lang="ts">
import type { ChannelEntry } from '@/data/channels'
import { formatCompactNumber } from '@/lib/format'

defineProps<{
  channel: ChannelEntry
  categoryLabels: string[]
  createdAtLabel: string | null
}>()
</script>

<template>
  <div class="grid gap-5 py-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
    <div class="card px-7 py-[26px]">
      <p class="text-[15px] leading-[1.75] text-[#18181f]/70">
        {{ channel.longDescription || 'Aucune description renseignée pour cette chaîne.' }}
      </p>
    </div>

    <div class="card divide-y divide-[#18181f]/[0.07] px-7">
      <div v-if="categoryLabels.length" class="flex items-center justify-between gap-4 py-4">
        <span class="text-[13.5px] text-[#18181f]/50">Catégorie</span>
        <span class="mono text-right text-[13.5px] font-semibold text-[#18181f]">{{ categoryLabels.join(', ') }}</span>
      </div>
      <div v-if="createdAtLabel" class="flex items-center justify-between gap-4 py-4">
        <span class="text-[13.5px] text-[#18181f]/50">Créée le</span>
        <span class="mono text-[13.5px] font-semibold text-[#18181f]">{{ createdAtLabel }}</span>
      </div>
      <div v-if="channel.country" class="flex items-center justify-between gap-4 py-4">
        <span class="text-[13.5px] text-[#18181f]/50">Pays</span>
        <span class="mono text-[13.5px] font-semibold text-[#18181f]">{{ channel.country }}</span>
      </div>
      <div class="flex items-center justify-between gap-4 py-4">
        <span class="text-[13.5px] text-[#18181f]/50">Abonnés</span>
        <span class="mono text-[13.5px] font-semibold text-[#18181f]">{{ formatCompactNumber(channel.followers) }}</span>
      </div>
      <div v-if="channel.viewCount" class="flex items-center justify-between gap-4 py-4">
        <span class="text-[13.5px] text-[#18181f]/50">Vues</span>
        <span class="mono text-[13.5px] font-semibold text-[#18181f]">{{ formatCompactNumber(channel.viewCount) }}</span>
      </div>
    </div>
  </div>
</template>

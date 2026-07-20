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
  <div class="flex flex-col gap-6 py-8">
    <div class="max-w-[640px] rounded-[14px] border border-[#18181f]/[0.08] bg-white px-7 py-[26px]">
      <p class="text-[14px] leading-[1.7] text-[#18181f]/70">
        {{ channel.longDescription || 'Aucune description renseignée pour cette chaîne.' }}
      </p>
    </div>

    <div v-if="categoryLabels.length" class="flex flex-wrap gap-2">
      <span
        v-for="label in categoryLabels"
        :key="label"
        class="rounded-full border border-[#18181f]/10 bg-[#f7f6fb] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#333]"
      >
        {{ label }}
      </span>
    </div>

    <dl class="flex max-w-[640px] flex-col gap-3 rounded-[14px] border border-[#18181f]/[0.08] bg-white px-7 py-5 text-sm">
      <div class="flex items-center justify-between gap-4">
        <dt class="text-[#18181f]/50">Identifiant</dt>
        <dd class="font-semibold text-[#18181f]">{{ channel.handle }}</dd>
      </div>
      <div v-if="createdAtLabel" class="flex items-center justify-between gap-4">
        <dt class="text-[#18181f]/50">Créée le</dt>
        <dd class="font-semibold text-[#18181f]">{{ createdAtLabel }}</dd>
      </div>
      <div v-if="channel.country" class="flex items-center justify-between gap-4">
        <dt class="text-[#18181f]/50">Pays</dt>
        <dd class="font-semibold text-[#18181f]">{{ channel.country }}</dd>
      </div>
      <div v-if="channel.ageRestriction" class="flex items-center justify-between gap-4">
        <dt class="text-[#18181f]/50">Restriction d'âge</dt>
        <dd class="font-semibold text-[#18181f]">{{ channel.ageRestriction }}+</dd>
      </div>
      <div v-if="channel.viewCount" class="flex items-center justify-between gap-4">
        <dt class="text-[#18181f]/50">Vues</dt>
        <dd class="font-semibold text-[#18181f]">{{ formatCompactNumber(channel.viewCount) }}</dd>
      </div>
    </dl>
  </div>
</template>

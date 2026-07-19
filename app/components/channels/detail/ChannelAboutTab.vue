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
  <div class="grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
    <div class="flex flex-col gap-4">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[#18181f]/40">Description</p>
      <p class="text-base leading-8 text-[#18181f]/70">
        {{ channel.longDescription || 'Aucune description renseignée pour cette chaîne.' }}
      </p>

      <div v-if="categoryLabels.length" class="mt-2 flex flex-wrap gap-2">
        <span
          v-for="label in categoryLabels"
          :key="label"
          class="rounded-full border border-[#18181f]/10 bg-[#f7f6fb] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#333]"
        >
          {{ label }}
        </span>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <div class="rounded-[14px] border border-[#18181f]/[0.08] bg-[#f7f6fb] p-5">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[#18181f]/40">Informations</p>
        <dl class="mt-4 flex flex-col gap-3 text-sm">
          <div class="flex items-center justify-between gap-4">
            <dt class="text-[#18181f]/50">Nom</dt>
            <dd class="font-semibold text-[#18181f]">{{ channel.name }}</dd>
          </div>
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
        </dl>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-[14px] bg-[#18181f] px-4 py-4 text-white">
          <p class="text-[11px] uppercase tracking-[0.16em] text-white/50">Suivis</p>
          <p class="mt-2 text-xl font-semibold">{{ formatCompactNumber(channel.followers) }}</p>
        </div>
        <div class="rounded-[14px] border border-[#18181f]/[0.08] bg-white px-4 py-4">
          <p class="text-[11px] uppercase tracking-[0.16em] text-[#18181f]/40">Vues</p>
          <p class="mt-2 text-xl font-semibold text-[#18181f]">{{ formatCompactNumber(channel.viewCount ?? 0) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

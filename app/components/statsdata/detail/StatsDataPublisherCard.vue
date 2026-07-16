<script setup lang="ts">
import { formatStatsDataDate } from '@/utils/statsDataFormat'
import StatsDataToggleButton from './StatsDataToggleButton.vue'
import StatsDataLinkButton from './StatsDataLinkButton.vue'

defineProps<{
  authorName?: string
  createdAt?: string
  updatedAt?: string
  isFollowing: boolean
  canEdit?: boolean
  profileEditPath?: string
}>()

defineEmits<{ 'toggle-follow': [] }>()
</script>

<template>
  <div class="rounded-2xl border border-[#18181f]/[0.08] bg-white px-5 py-5">
    <p class="mb-3.5 text-[11px] font-bold uppercase tracking-[0.04em] text-[#18181f]/45">Publié par</p>
    <div class="mb-4 flex items-center gap-3">
      <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
        {{ (authorName ?? '?').charAt(0).toUpperCase() }}
      </div>
      <div>
        <p class="text-sm font-bold text-[#18181f]">{{ authorName ?? 'Anonyme' }}</p>
        <p class="text-xs text-[#18181f]/45">Auteur</p>
      </div>
    </div>
    <div class="mb-3.5 flex flex-col gap-2 border-t border-b border-[#18181f]/[0.07] pt-3.5 pb-3.5">
      <div class="flex items-center justify-between text-[12.5px]">
        <span class="text-[#18181f]/50">Créé le</span>
        <span class="mono font-semibold text-[#18181f]">{{ formatStatsDataDate(createdAt) }}</span>
      </div>
      <div class="flex items-center justify-between text-[12.5px]">
        <span class="text-[#18181f]/50">Modifié le</span>
        <span class="mono font-semibold text-[#18181f]">{{ formatStatsDataDate(updatedAt) }}</span>
      </div>
    </div>
    <StatsDataLinkButton v-if="canEdit" :to="profileEditPath ?? '/user'" size="sm" full-width>
      Modifier le profil
    </StatsDataLinkButton>
    <StatsDataToggleButton
      v-else
      :active="isFollowing"
      active-label="✓ Suivi"
      inactive-label="+ Suivre"
      size="sm"
      full-width
      @toggle="$emit('toggle-follow')"
    />
  </div>
</template>

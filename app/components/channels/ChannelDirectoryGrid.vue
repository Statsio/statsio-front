<script setup lang="ts">
import ChannelCard from '@/components/channels/ChannelCard.vue'
import ChannelListRow from '@/components/channels/ChannelListRow.vue'
import AppButton from '@/components/ui/AppButton.vue'
import type { Channel } from '@/api/channels'

withDefaults(
  defineProps<{
    channels: Channel[]
    view?: 'grid' | 'list'
    loading: boolean
    error: string | null
    ownedIds?: Set<number>
  }>(),
  { ownedIds: () => new Set(), view: 'grid' },
)

const emit = defineEmits<{
  retry: []
  reset: []
}>()
</script>

<template>
  <div>
    <div v-if="loading" class="grid gap-[22px] md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="n in 6"
        :key="n"
        class="h-[13rem] animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
      />
    </div>

    <div
      v-else-if="error"
      class="flex flex-col items-center gap-4 rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center"
    >
      <p class="text-base font-semibold text-slate-900">{{ error }}</p>
      <AppButton variant="secondary" size="md" @click="emit('retry')">Réessayer</AppButton>
    </div>

    <div
      v-else-if="channels.length === 0"
      class="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--color-primary)]/30 bg-white px-6 py-16 text-center"
    >
      <p class="text-base font-semibold text-[#18181f]">Aucune chaîne ne correspond à votre recherche.</p>
      <p class="max-w-md text-sm leading-6 text-[#18181f]/50">
        Essayez d’élargir votre recherche ou de réinitialiser les filtres.
      </p>
      <AppButton variant="secondary" size="md" @click="emit('reset')">Réinitialiser les filtres</AppButton>
    </div>

    <div v-else-if="view === 'list'" class="overflow-hidden rounded-2xl border border-[#18181f]/[0.08] bg-white">
      <div
        class="grid grid-cols-[2.2fr_1fr_0.8fr_0.8fr_auto] gap-4 bg-[#f7f6fb] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.04em] text-[#18181f]/45 sm:px-6"
      >
        <span>Chaîne</span><span>Catégorie</span><span>Abonnés</span><span>Vues</span><span></span>
      </div>
      <ChannelListRow
        v-for="channel in channels"
        :key="channel.id"
        :channel="channel"
        :is-owner="ownedIds.has(channel.id)"
      />
    </div>

    <div v-else class="grid gap-[22px] md:grid-cols-2 xl:grid-cols-3">
      <ChannelCard
        v-for="channel in channels"
        :key="channel.id"
        :channel="channel"
        :is-owner="ownedIds.has(channel.id)"
      />
    </div>
  </div>
</template>

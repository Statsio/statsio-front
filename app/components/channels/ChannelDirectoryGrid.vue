<script setup lang="ts">
import ChannelDirectoryCard from '@/components/channels/ChannelDirectoryCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import type { Channel } from '@/api/channels'

defineProps<{
  channels: Channel[]
  loading: boolean
  error: string | null
}>()

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
      class="flex flex-col items-center gap-4 rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center"
    >
      <p class="text-base font-semibold text-slate-900">Aucune chaîne ne correspond à votre recherche.</p>
      <p class="max-w-md text-sm leading-6 text-slate-500">
        Essayez d’élargir votre recherche ou de réinitialiser les filtres.
      </p>
      <AppButton variant="secondary" size="md" @click="emit('reset')">Réinitialiser les filtres</AppButton>
    </div>

    <div v-else class="grid gap-[22px] md:grid-cols-2 xl:grid-cols-3">
      <ChannelDirectoryCard v-for="channel in channels" :key="channel.id" :channel="channel" />
    </div>
  </div>
</template>

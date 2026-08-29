<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AccountPageHeader from '@/components/user/AccountPageHeader.vue'
import ChannelCard from '@/components/channels/ChannelCard.vue'
import ChannelCreateCard from '@/components/chaines/ChannelCreateCard.vue'
import { getMyChannels, type Channel } from '@/api/channels'

definePageMeta({ layout: 'account', middleware: ['auth'], ssr: false, title: 'Mes chaînes', robots: 'noindex,nofollow' })

const route = useRoute()
const router = useRouter()

const channels = ref<Channel[]>([])
const isLoading = ref(true)
const loadError = ref('')
const createOpen = ref(false)

async function fetchChannels() {
  isLoading.value = true
  loadError.value = ''
  try {
    channels.value = await getMyChannels()
  } catch {
    loadError.value = 'Impossible de charger vos chaînes. Veuillez réessayer.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await fetchChannels()
  if (route.query.create) {
    createOpen.value = true
    router.replace({ query: { ...route.query, create: undefined } })
  }
})

function onChannelCreated(channel: Channel) {
  channels.value = [...channels.value, channel]
}
</script>

<template>
  <div>
    <AccountPageHeader
      title="Mes chaînes"
      subtitle="Les chaînes éditoriales que vous administrez."
      :show-actions="false"
    />

    <div v-if="isLoading" class="flex items-center justify-center py-32">
      <svg class="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <div v-else-if="loadError" class="py-20 text-center">
      <p class="text-sm text-slate-500">{{ loadError }}</p>
      <AppButton variant="primary" size="md" class="mt-6" @click="fetchChannels">Réessayer</AppButton>
    </div>

    <div v-else class="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
      <ChannelCard v-for="channel in channels" :key="channel.id" :channel="channel" is-owner />
      <ChannelCreateCard v-model:open="createOpen" @created="onChannelCreated" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import type { ChannelEntry } from '@/data/channels'
import { channelAccentStyle, channelBannerStyle } from '@/lib/channel-brand'

const props = defineProps<{
  channel: ChannelEntry
  isOwner: boolean
  isFollowing: boolean
  brandColor: string
  brandColorSecondary: string
}>()

const emit = defineEmits<{ 'toggle-follow': [] }>()

const accentStyle = computed(() => channelAccentStyle(props.brandColor))
const avatarFallbackStyle = computed(() => channelBannerStyle(props.brandColor, props.brandColorSecondary))
</script>

<template>
  <div class="-mt-10 flex flex-col items-start gap-5 pb-6 sm:-mt-[52px] sm:flex-row sm:items-end sm:justify-between">
    <div class="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
      <div
        class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border-4 border-white text-2xl font-bold text-white sm:h-[104px] sm:w-[104px] sm:text-[32px]"
        :style="channel.logoUrl ? undefined : avatarFallbackStyle"
      >
        <img v-if="channel.logoUrl" :src="channel.logoUrl" alt="" class="h-full w-full object-cover" />
        <span v-else>{{ channel.initials }}</span>
      </div>

      <div class="min-w-0 pb-1">
        <h1 class="text-xl font-bold text-[#18181f] sm:text-2xl">{{ channel.name }}</h1>
        <p class="mt-1 max-w-xl text-[13.5px] leading-5 text-[#18181f]/55">
          {{ channel.description || channel.handle }}
        </p>
      </div>
    </div>

    <AppButton
      v-if="isOwner"
      as="router-link"
      :to="`/channels/${channel.slug}/dashboard/profil`"
      variant="secondary"
      size="md"
      class="shrink-0"
    >
      Modifier le profil
    </AppButton>
    <AppButton
      v-else
      :variant="isFollowing ? 'secondary' : 'primary'"
      :style="isFollowing ? undefined : accentStyle"
      size="md"
      class="shrink-0"
      @click="emit('toggle-follow')"
    >
      {{ isFollowing ? 'Suivi' : 'Suivre' }}
    </AppButton>
  </div>
</template>

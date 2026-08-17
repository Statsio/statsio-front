<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import ChannelShareModal from '@/components/channels/detail/ChannelShareModal.vue'
import ChannelBadgeList from '@/components/channels/ChannelBadgeList.vue'
import type { ChannelEntry } from '@/data/channels'
import { channelAccentStyle, channelBannerStyle } from '@/lib/channel-brand'

const props = defineProps<{
  channel: ChannelEntry
  isOwner: boolean
  isFollowing: boolean
  categoryLabel: string
  brandColor: string
  brandColorSecondary: string
}>()

const emit = defineEmits<{ 'toggle-follow': [] }>()

const accentStyle = computed(() => channelAccentStyle(props.brandColor))
const avatarFallbackStyle = computed(() => channelBannerStyle(props.brandColor, props.brandColorSecondary))

const isShareOpen = ref(false)
</script>

<template>
  <div class="flex flex-col items-start gap-5 pb-6 pt-4 sm:flex-row sm:items-start sm:justify-between">
    <div class="flex flex-col items-start gap-4 sm:flex-row sm:pl-8">
      <div
        class="relative z-10 -mt-10 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border-4 border-white bg-white text-2xl font-extrabold text-white shadow-[0_14px_30px_rgba(124,58,237,0.24)] sm:-mt-14 sm:h-[104px] sm:w-[104px] sm:rounded-[28px] sm:text-[34px]"
        :style="channel.logoUrl ? undefined : avatarFallbackStyle"
      >
        <img v-if="channel.logoUrl" :src="channel.logoUrl" alt="" class="h-full w-full object-cover" />
        <span v-else>{{ channel.initials }}</span>
      </div>

      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1 class="text-[28px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#18181f] sm:text-[40px]">
            {{ channel.name }}
          </h1>
          <ChannelBadgeList :slugs="channel.badges" :organization="channel.organization" />
        </div>
        <p v-if="categoryLabel" class="mt-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--color-primary)]">
          {{ categoryLabel }}
        </p>
        <p class="mt-2 max-w-xl text-[14.5px] leading-[1.55] text-[#18181f]/55">
          {{ channel.description || channel.handle }}
        </p>
      </div>
    </div>

    <div class="flex shrink-0 gap-2.5 sm:pt-1">
      <AppButton
        v-if="isOwner"
        as="router-link"
        :to="`/channels/${channel.slug}/dashboard/profil`"
        variant="secondary"
        size="md"
      >
        Modifier le profil
      </AppButton>
      <AppButton
        v-else
        :variant="isFollowing ? 'secondary' : 'primary'"
        :style="isFollowing ? undefined : accentStyle"
        size="md"
        @click="emit('toggle-follow')"
      >
        {{ isFollowing ? 'Suivi' : 'Suivre' }}
      </AppButton>

      <button
        type="button"
        title="Partager la chaîne"
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#18181f]/[0.14] bg-white text-[#18181f] transition-colors hover:bg-[#f7f6fb]"
        @click="isShareOpen = true"
      >
        <span class="sr-only">Partager la chaîne</span>
        <svg viewBox="0 0 20 20" fill="none" class="h-4 w-4" aria-hidden="true">
          <path
            d="M14 7a2 2 0 100-4 2 2 0 000 4zM6 12a2 2 0 100-4 2 2 0 000 4zm8 7a2 2 0 100-4 2 2 0 000 4zM7.7 10.9l4.6 2.9M12.3 6.2 7.7 9.1"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <ChannelShareModal v-model:open="isShareOpen" :channel-name="channel.name" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { channelBannerStyle } from '@/lib/channel-brand'

const props = defineProps<{
  bannerUrl?: string | null
  colorPrimary: string
  colorSecondary: string
  editHref?: string | null
}>()

const gradientStyle = computed(() => channelBannerStyle(props.colorPrimary, props.colorSecondary))
</script>

<template>
  <div class="relative mt-4 h-[150px] w-full overflow-hidden rounded-[24px] bg-slate-950 sm:h-[230px]">
    <img v-if="bannerUrl" :src="bannerUrl" alt="" class="h-full w-full object-cover" />
    <div v-else class="h-full w-full" :style="gradientStyle" />

    <RouterLink
      v-if="editHref"
      :to="editHref"
      class="absolute right-4 top-4 rounded-full bg-white/85 px-3.5 py-2 text-xs font-bold text-[#18181f] backdrop-blur transition-colors hover:bg-white"
    >
      Modifier la bannière
    </RouterLink>
  </div>
</template>

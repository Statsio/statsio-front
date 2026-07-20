<script setup lang="ts">
import { computed } from 'vue'
import { channelBannerStyle } from '@/lib/channel-brand'

const props = defineProps<{
  bannerUrl?: string | null
  colorPrimary: string
  colorSecondary: string
}>()

const gradientStyle = computed(() => channelBannerStyle(props.colorPrimary, props.colorSecondary))
</script>

<template>
  <div class="relative h-32 w-full overflow-hidden rounded-b-[20px] bg-slate-950 sm:h-[180px]">
    <img v-if="bannerUrl" :src="bannerUrl" alt="" class="h-full w-full object-cover" />
    <div v-else class="h-full w-full" :style="gradientStyle" />
  </div>
</template>

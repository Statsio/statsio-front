<script setup lang="ts">
import { computed } from 'vue'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'
import { channelBannerArt } from '@/lib/channels-listing'
import type { ChannelCatalogItem } from '@/types/channel-catalog'

/**
 * Bannière d'une chaîne : son image si elle en a une, sinon une bannière générée
 * en tranches aux couleurs de la chaîne. Duplique le lien du nom pour la souris
 * (hors tabulation, masquée aux lecteurs d'écran).
 */
const props = withDefaults(
  defineProps<{
    item: Pick<
      ChannelCatalogItem,
      'id' | 'banner_url' | 'custom_color_primary' | 'custom_color_secondary'
    >
    to: string
    height?: number
  }>(),
  { height: 92 },
)

const BOX_W = 400
const art = computed(() => channelBannerArt(props.item, { width: BOX_W, height: props.height }))
</script>

<template>
  <NuxtLink
    :to="to"
    class="chban"
    :style="{ height: `${height}px` }"
    tabindex="-1"
    aria-hidden="true"
  >
    <AppMediaImage
      v-if="item.banner_url"
      :src="item.banner_url"
      alt=""
      class="chban__img"
      loading="lazy"
    />
    <svg v-else :viewBox="`0 0 ${BOX_W} ${height}`" preserveAspectRatio="xMidYMid slice">
      <rect :width="BOX_W" :height="height" :style="{ fill: art.background }" />
      <path
        v-for="(s, i) in art.slices"
        :key="`s${i}`"
        :d="s.d"
        :fill="s.fill"
        :opacity="s.opacity"
      />
      <rect
        v-for="(b, i) in art.bars"
        :key="`b${i}`"
        :x="b.x"
        :y="b.y"
        :width="b.w"
        :height="b.h"
        :fill="b.fill"
        opacity=".9"
      />
    </svg>
  </NuxtLink>
</template>

<style scoped>
.chban {
  position: relative;
  display: block;
  overflow: hidden;
  border-bottom: 2px solid var(--ds-ol);
  background: var(--ds-tint);
}
.chban svg {
  display: block;
  width: 100%;
  height: 100%;
}
.chban__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

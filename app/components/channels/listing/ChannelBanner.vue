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
    /** Absent : bannière décorative (page détail, le nom porte déjà le lien). */
    to?: string
    height?: number
    /** Hauteur fluide du hero détail (clamp), le viewBox reste sur `height`. */
    fluid?: boolean
  }>(),
  { height: 92, fluid: false },
)

const BOX_W = 400
const boxH = computed(() => (props.fluid ? 210 : props.height))
const art = computed(() => channelBannerArt(props.item, { width: BOX_W, height: boxH.value }))
</script>

<template>
  <component
    :is="to ? 'NuxtLink' : 'div'"
    :to="to || undefined"
    class="chban"
    :class="{ 'chban--fluid': fluid }"
    :style="fluid ? undefined : { height: `${height}px` }"
    :tabindex="to ? -1 : undefined"
    :aria-hidden="to ? true : undefined"
  >
    <AppMediaImage
      v-if="item.banner_url"
      :src="item.banner_url"
      alt=""
      class="chban__img"
      loading="lazy"
    />
    <svg v-else :viewBox="`0 0 ${BOX_W} ${boxH}`" preserveAspectRatio="xMidYMid slice">
      <rect :width="BOX_W" :height="boxH" :style="{ fill: art.background }" />
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
  </component>
</template>

<style scoped>
.chban {
  position: relative;
  display: block;
  overflow: hidden;
  border-bottom: 2px solid var(--ds-ol);
  background: var(--ds-tint);
}
.chban--fluid {
  height: clamp(130px, 17vw, 210px);
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

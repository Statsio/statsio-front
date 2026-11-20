<script setup lang="ts">
import DsHighlight from '@/components/ds/DsHighlight.vue'
import ChannelKindBadge from './ChannelKindBadge.vue'
import ChannelVerifiedMark from './ChannelVerifiedMark.vue'
import type { ChannelCatalogItem } from '@/types/channel-catalog'

/** Nom (seul lien focalisable de la carte) + rosette, puis @identifiant et type. Slot : pastilles en plus. */
withDefaults(
  defineProps<{
    item: Pick<ChannelCatalogItem, 'name' | 'handle' | 'kind' | 'verified'>
    to: string
    query?: string
    size?: 'md' | 'lg'
  }>(),
  { query: '', size: 'md' },
)
</script>

<template>
  <div class="chhd" :class="`chhd--${size}`">
    <div class="chhd__name">
      <NuxtLink :to="to"
        ><h3><DsHighlight :text="item.name" :query="query" /></h3
      ></NuxtLink>
      <ChannelVerifiedMark v-if="item.verified" />
    </div>
    <div class="chhd__row">
      <span class="chhd__handle">@<DsHighlight :text="item.handle" :query="query" /></span>
      <ChannelKindBadge :kind="item.kind" />
      <slot />
    </div>
  </div>
</template>

<style scoped>
.chhd__name {
  display: flex;
  align-items: center;
  gap: 6px;
}
.chhd__name a {
  min-width: 0;
  color: var(--ds-text);
  text-decoration: none;
}
.chhd__name a:hover h3 {
  color: var(--ds-link);
}
.chhd__name a:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 3px;
}
.chhd h3 {
  margin: 0;
  font: 800 22px/1.05 var(--ds-display);
  font-stretch: 95%;
  letter-spacing: -0.01em;
  text-wrap: balance;
}
.chhd--lg h3 {
  font-size: clamp(30px, 3.4vw, 42px);
}
.chhd__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.chhd__handle {
  color: var(--ds-faint);
  font: 400 12px var(--ds-num);
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import DsSwatch from '@/components/ds/DsSwatch.vue'
import { channelMix } from '@/lib/channels-listing'
import type { ChannelCatalogItem } from '@/types/channel-catalog'

/** Mix éditorial : barre en tranches (StatsData / articles / sondages) + légende. */
const props = defineProps<{
  item: Pick<ChannelCatalogItem, 'statsdata_count' | 'articles_count' | 'surveys_count'>
  /** Barre haute du hero : le décompte est écrit dans chaque tranche. */
  inline?: boolean
}>()
const parts = computed(() => channelMix(props.item))
const label = computed(() =>
  parts.value.map((p) => `${p.count} ${p.label.toLowerCase()}`).join(', '),
)
</script>

<template>
  <div v-if="parts.length" class="chmix" :class="{ 'chmix--inline': inline }">
    <div class="chmix__bar" role="img" :aria-label="`Publications : ${label}`">
      <i
        v-for="p in parts"
        :key="p.key"
        :class="{ 'is-light': p.key === 'survey' }"
        :style="{ flex: p.count, background: p.color }"
        >{{ inline ? `${p.count} ${p.label}` : '' }}</i
      >
    </div>
    <div v-if="!inline" class="chmix__leg" aria-hidden="true">
      <span v-for="p in parts" :key="p.key"
        ><DsSwatch :color="p.color" :size="9" />{{ p.count }} {{ p.label }}</span
      >
    </div>
  </div>
</template>

<style scoped>
.chmix {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.chmix__bar {
  display: flex;
  height: 12px;
  overflow: hidden;
  border: 2px solid var(--ds-ol);
  border-radius: 2px;
}
.chmix__bar i {
  display: block;
  height: 100%;
}
.chmix--inline .chmix__bar {
  height: 30px;
  border-radius: 3px;
}
.chmix--inline .chmix__bar i {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: #fff;
  font: 500 12px var(--ds-num);
  white-space: nowrap;
}
.chmix--inline .chmix__bar i.is-light {
  color: #1b1530;
}
.chmix__bar i + i {
  border-left: 2px solid var(--ds-ol);
}
.chmix__leg {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  color: var(--ds-muted);
  font: 400 11.5px var(--ds-num);
}
.chmix__leg span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
</style>

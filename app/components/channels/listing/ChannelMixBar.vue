<script setup lang="ts">
import { computed } from 'vue'
import DsSwatch from '@/components/ds/DsSwatch.vue'
import { channelMix } from '@/lib/channels-listing'
import type { ChannelCatalogItem } from '@/types/channel-catalog'

/** Mix éditorial : barre en tranches (StatsData / articles / sondages) + légende. */
const props = defineProps<{
  item: Pick<ChannelCatalogItem, 'statsdata_count' | 'articles_count' | 'surveys_count'>
}>()
const parts = computed(() => channelMix(props.item))
const label = computed(() =>
  parts.value.map((p) => `${p.count} ${p.label.toLowerCase()}`).join(', '),
)
</script>

<template>
  <div v-if="parts.length" class="chmix">
    <div class="chmix__bar" role="img" :aria-label="`Publications : ${label}`">
      <i v-for="p in parts" :key="p.key" :style="{ flex: p.count, background: p.color }" />
    </div>
    <div class="chmix__leg" aria-hidden="true">
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

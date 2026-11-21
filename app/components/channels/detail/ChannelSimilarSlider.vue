<script setup lang="ts">
import { computed } from 'vue'
import type { ChannelEntry } from '@/data/channels'
import DsButton from '@/components/ds/DsButton.vue'
import DsHeading from '@/components/ds/DsHeading.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import ChannelSimilarCard from './ChannelSimilarCard.vue'
import { useSimilarChannels } from '@/composables/useSimilarChannels'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { publicChannelListPath } from '@/lib/content-display'

const props = defineProps<{ channel: ChannelEntry }>()
const { channels, loading } = useSimilarChannels(computed(() => props.channel))
const basePath = useContentBasePath()
const listPath = computed(() => publicChannelListPath(basePath.value))
</script>

<template>
  <section class="simil" aria-labelledby="sim-h">
    <div class="simil__h">
      <div>
        <DsLabel>Si vous aimez cette chaîne</DsLabel>
        <DsHeading id="sim-h" level="2" size="xl">Chaînes <em>similaires</em></DsHeading>
      </div>
      <DsButton size="sm" variant="secondary" :to="listPath">
        Toutes les chaînes <span aria-hidden="true">→</span>
      </DsButton>
    </div>

    <div v-if="loading" class="simil__grid">
      <div v-for="n in 3" :key="n" class="simil__sk" />
    </div>
    <p v-else-if="!channels.length" class="simil__empty">Aucune autre chaîne disponible pour le moment.</p>
    <div v-else class="simil__grid">
      <ChannelSimilarCard v-for="item in channels.slice(0, 3)" :key="item.id" :channel="item" />
    </div>
  </section>
</template>

<style scoped>
.simil {
  margin-top: 72px;
}
.simil__h {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 22px;
}
.simil__h :deep(h2) {
  margin-top: 10px;
}
.simil__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}
.simil__sk {
  height: 280px;
  border: 2px solid var(--ds-divide);
  border-radius: 6px;
  background: var(--ds-tint);
}
.simil__empty {
  margin: 0;
  color: var(--ds-muted);
  font-size: 14px;
}
@media (max-width: 1040px) {
  .simil__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 620px) {
  .simil__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

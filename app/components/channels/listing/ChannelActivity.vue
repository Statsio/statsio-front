<script setup lang="ts">
import { computed } from 'vue'
import { activityCells, activitySummary, channelPaceOf } from '@/lib/channels-listing'
import type { ChannelCatalogItem } from '@/types/channel-catalog'

/**
 * Activité sur 30 jours : une case par jour (remplie si la chaîne a publié, la
 * dernière parution en accent) + rythme. `compact` : version tableau (rythme court).
 */
const props = defineProps<{
  item: Pick<ChannelCatalogItem, 'pace' | 'activity_days' | 'last_published_at'>
  compact?: boolean
  /** Frise haute du hero détail, avec l'axe « il y a 30 j → aujourd'hui ». */
  hero?: boolean
}>()

const cells = computed(() => activityCells(props.item.activity_days))
const days = computed(() => cells.value.filter((c) => c.on).length)
const summary = computed(() => activitySummary(props.item))
</script>

<template>
  <div class="chact" :class="{ 'chact--compact': compact, 'chact--hero': hero }">
    <div
      class="chact__strip"
      role="img"
      :aria-label="`${days} jour${days > 1 ? 's' : ''} de parution sur les 30 derniers`"
    >
      <i v-for="(c, i) in cells" :key="i" :class="{ 'is-on': c.on, 'is-last': c.last }" />
    </div>
    <span v-if="compact" class="chact__meta"
      >{{ channelPaceOf(item.pace).label }} · {{ days }} j / 30</span
    >
    <span v-else-if="!hero" class="chact__meta"
      ><b>{{ summary.pace }}</b> · {{ summary.detail }}</span
    >
    <div v-if="hero" class="chact__axis" aria-hidden="true">
      <span>il y a 30 j</span><span>il y a 15 j</span><span>aujourd'hui</span>
    </div>
  </div>
</template>

<style scoped>
.chact {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.chact--compact {
  width: 150px;
}
.chact__strip {
  display: grid;
  grid-template-columns: repeat(30, minmax(0, 1fr));
  gap: 2px;
}
.chact__strip i {
  height: 14px;
  border-radius: 1px;
  background: var(--ds-line);
}
.chact--compact .chact__strip i {
  height: 10px;
}
.chact__strip i.is-on {
  background: var(--ds-t1);
}
.chact__strip i.is-last {
  background: var(--ds-accent);
}
.chact__meta {
  color: var(--ds-faint);
  font: 400 12px/1.4 var(--ds-num);
}
.chact__meta b {
  color: var(--ds-text);
  font-weight: 500;
}
.chact--hero .chact__strip {
  gap: 3px;
}
.chact--hero .chact__strip i {
  height: 30px;
  border-radius: 2px;
  background: var(--ds-surface);
  outline: 1.5px solid var(--ds-divide);
}
.chact--hero .chact__strip i.is-on {
  background: var(--ds-t1);
  outline-color: var(--ds-ol);
}
.chact--hero .chact__strip i.is-last {
  background: var(--ds-t2);
}
.chact__axis {
  display: flex;
  justify-content: space-between;
  color: var(--ds-muted);
  font: 400 10.5px var(--ds-num);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
</style>

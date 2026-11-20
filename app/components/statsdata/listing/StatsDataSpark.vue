<script setup lang="ts">
import { computed, ref } from 'vue'
import DsPie from '@/components/ds/DsPie.vue'
import { useInViewOnce } from '@/composables/useInViewOnce'
import { useStatsDataPreview } from '@/composables/useStatsDataPreview'
import { buildSpark, previewHeadline } from '@/lib/statsdata-listing'
import type { CatalogItem } from '@/types/catalog'

/** Tendance de la vue liste : mini-graphe du graphique lié + chiffre clé, chargés à l'entrée dans l'écran. */
const props = defineProps<{ item: CatalogItem }>()

const root = ref<HTMLElement | null>(null)
const { preview, status, load } = useStatsDataPreview(() => props.item.slug)
useInViewOnce(
  root,
  () => {
    if (props.item.charts_count > 0) void load()
  },
  0,
)

const BOX = { width: 120, height: 34 }
const spark = computed(() => (preview.value ? buildSpark(preview.value, BOX) : null))
const headline = computed(() => (preview.value ? previewHeadline(preview.value) : null))
const pie = computed(() => {
  if (preview.value?.kind !== 'pie') return []
  const colors = ['var(--ds-t1)', 'var(--ds-t2)', 'var(--ds-t3)', 'var(--ds-t4)', 'var(--ds-t5)']
  return (preview.value.series?.[0]?.values ?? [])
    .slice(0, 5)
    .map((v, i) => ({ value: Math.abs(v), color: colors[i]! }))
})
</script>

<template>
  <span ref="root" class="sdspark">
    <template v-if="status === 'ready'">
      <DsPie
        v-if="pie.length"
        :segments="pie"
        :size="34"
        :animate="false"
        label=""
        aria-hidden="true"
      />
      <svg v-else-if="spark" :viewBox="`0 0 ${BOX.width} ${BOX.height}`" aria-hidden="true">
        <template v-if="spark.kind === 'line'">
          <polyline :points="spark.points" class="sdspark__line" />
          <circle :cx="spark.end.x" :cy="spark.end.y" r="3" class="sdspark__dot" />
        </template>
        <template v-else>
          <rect
            v-for="(b, i) in spark.bars"
            :key="i"
            :x="b.x"
            :y="b.y"
            :width="b.w"
            :height="b.h"
            :class="b.emph ? 'sdspark__bar is-emph' : 'sdspark__bar'"
          />
        </template>
      </svg>
      <span v-if="headline" class="sdspark__kp ds-tnum">{{ headline.value }}</span>
    </template>
    <span v-else-if="status === 'loading'" class="sdspark__ghost" />
    <span v-else class="sdspark__none">—</span>
  </span>
</template>

<style scoped>
.sdspark {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 120px;
}
.sdspark svg {
  display: block;
  width: 120px;
  height: 34px;
}
.sdspark__line {
  fill: none;
  stroke: var(--ds-accent);
  stroke-width: 2;
  stroke-linejoin: round;
}
.sdspark__dot {
  fill: var(--ds-accent);
}
.sdspark__bar {
  fill: var(--ds-t3);
}
.sdspark__bar.is-emph {
  fill: var(--ds-accent);
}
.sdspark__kp {
  color: var(--ds-text);
  font: 400 12px/1.3 var(--ds-num);
}
.sdspark__ghost {
  display: block;
  width: 120px;
  height: 34px;
  border-radius: 3px;
  background: var(--ds-tint);
}
.sdspark__none {
  color: var(--ds-faint);
  font: 400 12px var(--ds-num);
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsMeta from '@/components/ds/DsMeta.vue'
import DsPie from '@/components/ds/DsPie.vue'
import { formatCatalogCount } from '@/lib/catalog-format'
import type { HomeDayFigure } from '@/lib/home-tranches'

/**
 * « Le chiffre du jour » : la part du catalogue publié qui porte sur le thème le
 * plus présent — un vrai calcul, détaillé sous le chiffre (« Calcul : … »).
 * Le pourcentage porte sa tranche (règle de la charte).
 */
const props = defineProps<{ figure: HomeDayFigure; href: string }>()

const segments = computed(() => [{ value: props.figure.pct, color: 'var(--ds-blue-500)', label: props.figure.theme.label }])
</script>

<template>
  <DsBox as="aside" class="df" aria-label="Le chiffre du jour">
    <div class="df__top">
      <DsLabel>Le chiffre du jour</DsLabel>
      <DsMeta>{{ figure.theme.label }}</DsMeta>
    </div>
    <div class="df__big">
      <DsPie :segments="segments" :total="100" :size="96" separator="outline" :label="`${figure.pct} %`" />
      <b class="ds-tnum">{{ figure.pct }}&nbsp;%</b>
    </div>
    <p class="df__text">
      des contenus publiés sur Statsio portent sur <strong>{{ figure.theme.label }}</strong>, le sujet le plus couvert
      du catalogue.
    </p>
    <DsButton variant="secondary" :to="href" class="self-start">
      Explorer ce sujet <span aria-hidden="true">→</span>
    </DsButton>
    <p class="df__how">
      Calcul : {{ formatCatalogCount(figure.theme.count) }} contenus classés « {{ figure.theme.label }} » sur
      {{ formatCatalogCount(figure.total) }} contenus publiés (articles, StatsData et sondages).
    </p>
  </DsBox>
</template>

<style scoped>
.df {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px;
}
.df__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.df__big {
  display: flex;
  align-items: center;
  gap: 18px;
}
.df__big b {
  color: var(--ds-accent);
  font: 800 clamp(64px, 8vw, 104px) / 0.9 var(--ds-display);
  font-stretch: 115%;
  letter-spacing: -0.03em;
}
.df__text {
  margin: 0;
  font-size: 17px;
  line-height: 1.5;
}
.df__how {
  margin: 0;
  padding-top: 12px;
  border-top: 2px solid var(--ds-divide);
  color: var(--ds-muted);
  font-size: 13.5px;
}
</style>

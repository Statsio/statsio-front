<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsHeading from '@/components/ds/DsHeading.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsPie from '@/components/ds/DsPie.vue'
import { publicContentPath } from '@/lib/content-display'
import { formatCatalogCount } from '@/lib/catalog-format'
import type { CatalogItem } from '@/types/catalog'

/**
 * « La question du jour » : un sondage ouvert, résultats réels (`primary_options`)
 * en camembert + barres. Pas de vote inline : chaque option mène au sondage, où
 * le parcours existant (connexion, vérification d'identité…) s'applique.
 */
const props = defineProps<{ survey: CatalogItem; basePath: string }>()

const COLORS = ['var(--ds-t1)', 'var(--ds-t2)', 'var(--ds-t3)', 'var(--ds-t4)', 'var(--ds-context)']

const href = computed(() => publicContentPath('survey', props.survey.slug, props.basePath))
const options = computed(() => {
  const opts = props.survey.primary_options ?? []
  // 5 parts max : les suivantes sont regroupées en « Autres ».
  if (opts.length <= 5) return opts.map((o) => ({ label: o.label, pct: Math.round(o.pct) }))
  const head = opts.slice(0, 4).map((o) => ({ label: o.label, pct: Math.round(o.pct) }))
  const rest = opts.slice(4).reduce((a, o) => a + o.pct, 0)
  return [...head, { label: 'Autres', pct: Math.round(rest) }]
})
const segments = computed(() =>
  options.value.map((o, i) => ({ value: o.pct, color: COLORS[i % COLORS.length]!, label: o.label })),
)
const responses = computed(() => props.survey.responses_count ?? 0)
const publisher = computed(() => props.survey.publisher?.name)
</script>

<template>
  <DsBox as="aside" class="dq" aria-label="La question du jour">
    <DsLabel>La question du jour<template v-if="publisher"> · <b>{{ publisher }}</b></template></DsLabel>
    <DsHeading :level="3" size="md">{{ survey.title }}</DsHeading>
    <div class="dq__body">
      <DsPie :segments="segments" :total="100" :size="110" animate="view" label="Résultats du sondage" />
      <div class="dq__opts">
        <RouterLink v-for="(o, i) in options" :key="o.label" :to="href" class="dq__opt">
          <span class="dq__nm">{{ o.label }}</span>
          <span class="dq__pc ds-tnum">{{ o.pct }}&nbsp;%</span>
          <span class="dq__bar" aria-hidden="true"><i :style="{ width: `${o.pct}%`, background: COLORS[i % COLORS.length] }" /></span>
        </RouterLink>
      </div>
    </div>
    <DsButton :to="href" class="self-start">Répondre au sondage <span aria-hidden="true">→</span></DsButton>
    <p class="dq__note">
      {{ formatCatalogCount(responses) }} réponse{{ responses > 1 ? 's' : '' }} pour l'instant. Les pourcentages
      sont ceux des participants, pas un échantillon représentatif.
    </p>
  </DsBox>
</template>

<style scoped>
.dq {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}
.dq__body {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}
@media (max-width: 420px) {
  .dq__body {
    grid-template-columns: minmax(0, 1fr);
  }
}
.dq__opts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dq__opt {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px 10px;
  align-items: center;
  padding: 10px 12px;
  border: 2px solid var(--ds-divide);
  border-radius: 4px;
  background: var(--ds-surface);
  transition: border-color 0.15s;
}
.dq__opt:hover {
  border-color: var(--ds-ol);
}
.dq__opt:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 2px;
}
.dq__nm {
  font-size: 14.5px;
  font-weight: 600;
}
.dq__pc {
  color: var(--ds-muted);
  font: 500 12.5px var(--ds-num);
}
.dq__bar {
  grid-column: 1 / -1;
  height: 6px;
  overflow: hidden;
  border-radius: 0 2px 2px 0;
  background: var(--ds-line);
}
.dq__bar i {
  display: block;
  height: 100%;
}
.dq__note {
  margin: 0;
  color: var(--ds-faint);
  font: 400 12px/1.5 var(--ds-num);
}
</style>

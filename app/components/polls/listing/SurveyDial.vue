<script setup lang="ts">
import { computed } from 'vue'
import DsPie from '@/components/ds/DsPie.vue'
import DsSwatch from '@/components/ds/DsSwatch.vue'
import { PIE_START, sectorPath } from '@/lib/ds/pie'
import {
  plural,
  SMALL_SAMPLE,
  surveyDial,
  surveyDialLabel,
  surveyKindOf,
} from '@/lib/surveys-listing'
import type { CatalogItem } from '@/types/catalog'

/**
 * État d'une consultation, façon charte « Tranches » : un cadran + sa lecture.
 * - sondage rapide : camembert des réponses, l'option en tête en grand ;
 * - questionnaire : anneau d'une tranche par question, nombre au centre ;
 * - pétition : jauge des signatures vers l'objectif.
 * `size="lg"` : carte « À la une » (cadran plus grand, légende complète).
 */
const props = withDefaults(defineProps<{ item: CatalogItem; size?: 'md' | 'lg' }>(), { size: 'md' })

const dial = computed(() => surveyDial(props.item))
const label = computed(() => surveyDialLabel(dial.value))
const unit = computed(() => surveyKindOf(props.item).unit)
const px = computed(() => (props.size === 'lg' ? 200 : 96))

const questionRing = computed(() => {
  if (dial.value.kind !== 'questions') return []
  const n = Math.max(1, dial.value.questions)
  const w = 360 / n
  return Array.from({ length: n }, (_, i) =>
    sectorPath(60, 60, 56, PIE_START + i * w + 3, PIE_START + (i + 1) * w - 3),
  )
})
const signatureArc = computed(() =>
  dial.value.kind === 'signatures' && dial.value.progress > 0
    ? sectorPath(60, 60, 56, PIE_START, PIE_START + 360 * dial.value.progress)
    : '',
)
const legend = computed(() =>
  dial.value.kind === 'results' ? dial.value.ranked.slice(0, props.size === 'lg' ? 5 : 3) : [],
)
const nf = (n: number) => n.toLocaleString('fr-FR')
</script>

<template>
  <div class="sdial" :class="`sdial--${size}`">
    <!-- cadran -->
    <DsPie
      v-if="dial.kind === 'results' && dial.responses"
      :segments="dial.options.map((o) => ({ value: o.pct, color: o.color, label: o.label }))"
      :size="px"
      :animate="false"
      :label="label"
      class="sdial__svg"
    />
    <svg v-else viewBox="0 0 120 120" class="sdial__svg" role="img" :aria-label="label">
      <template v-if="dial.kind === 'questions'">
        <path
          v-for="(d, i) in questionRing"
          :key="i"
          :d="d"
          class="sdial__q"
          :class="{ 'is-on': i === 0 }"
        />
        <circle cx="60" cy="60" r="30" class="sdial__core" />
        <text x="60" y="68" text-anchor="middle" class="sdial__n">{{ dial.questions }}</text>
      </template>
      <template v-else>
        <circle cx="60" cy="60" r="56" class="sdial__track" />
        <path
          v-if="signatureArc"
          :d="signatureArc"
          class="sdial__arc"
          :class="{ 'is-done': dial.kind === 'signatures' && dial.progress >= 1 }"
        />
        <circle cx="60" cy="60" r="57" class="sdial__ring" />
        <template v-if="dial.kind === 'signatures'">
          <circle cx="60" cy="60" r="30" class="sdial__core" />
          <text v-if="dial.goal" x="60" y="66" text-anchor="middle" class="sdial__pct">
            {{ Math.round(dial.progress * 100) }} %
          </text>
        </template>
      </template>
    </svg>

    <!-- lecture -->
    <div class="sdial__rd">
      <template v-if="dial.kind === 'results'">
        <span class="sdial__cap">En tête · {{ plural(dial.responses, unit) }}</span>
        <template v-if="dial.responses && legend.length">
          <b class="sdial__big ds-tnum">{{ legend[0]!.pct }} %</b>
          <ul class="sdial__leg">
            <li v-for="o in legend" :key="o.label">
              <DsSwatch :color="o.color" :size="10" />
              <span>{{ o.label }}</span>
              <b class="ds-tnum">{{ o.pct }} %</b>
            </li>
          </ul>
          <span v-if="dial.responses < SMALL_SAMPLE" class="sdial__cap sdial__cap--faint"
            >Échantillon trop petit, indicatif</span
          >
        </template>
        <b v-else class="sdial__big">Soyez le premier</b>
      </template>
      <template v-else-if="dial.kind === 'questions'">
        <span class="sdial__cap">Questionnaire</span>
        <b class="sdial__big ds-tnum"
          >{{ dial.questions }} question{{ dial.questions > 1 ? 's' : '' }}</b
        >
        <span class="sdial__cap"
          >≈ {{ dial.minutes }} min · {{ plural(dial.participants, unit) }}</span
        >
      </template>
      <template v-else>
        <span class="sdial__cap">{{
          dial.goal && dial.progress >= 1 ? 'Objectif atteint' : 'Signatures'
        }}</span>
        <b class="sdial__big ds-tnum">{{ nf(dial.signatures) }}</b>
        <span v-if="dial.goal" class="sdial__cap">sur {{ nf(dial.goal) }} visées</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.sdial {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
}
.sdial--lg {
  grid-template-columns: minmax(0, 1fr);
  justify-items: center;
  gap: 18px;
}
.sdial__svg {
  display: block;
  width: 96px;
  height: 96px;
}
.sdial--lg .sdial__svg {
  width: 200px;
  height: 200px;
}
.sdial__track,
.sdial__q {
  fill: var(--ds-surface);
}
.sdial__q {
  stroke: var(--ds-ol);
  stroke-width: 2;
  stroke-linejoin: round;
}
.sdial__q.is-on {
  fill: var(--ds-t3);
}
.sdial__arc {
  fill: var(--ds-t2);
  stroke: var(--ds-surface);
  stroke-width: 2;
}
.sdial__arc.is-done {
  fill: var(--ds-ok);
}
.sdial__ring {
  fill: none;
  stroke: var(--ds-ol);
  stroke-width: 2;
}
.sdial__core {
  fill: var(--ds-tint);
  stroke: var(--ds-ol);
  stroke-width: 2;
}
.sdial__n {
  fill: var(--ds-text);
  font: 800 22px var(--ds-display);
}
.sdial__pct {
  fill: var(--ds-text);
  font: 700 16px var(--ds-num);
}
.sdial__rd {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.sdial--lg .sdial__rd {
  width: 100%;
  max-width: 340px;
}
.sdial__cap {
  color: var(--ds-muted);
  font: 500 10.5px/1.3 var(--ds-num);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.sdial__cap--faint {
  color: var(--ds-faint);
}
.sdial__big {
  color: var(--ds-accent);
  font: 800 28px/1 var(--ds-display);
  font-stretch: 110%;
  letter-spacing: -0.02em;
}
.sdial__leg {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin: 0;
  padding: 0;
  font-size: 12.5px;
  list-style: none;
}
.sdial--lg .sdial__leg {
  gap: 6px;
  font-size: 14px;
}
.sdial__leg li {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  gap: 6px;
  align-items: center;
}
.sdial__leg span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.sdial__leg b {
  font: 500 11.5px var(--ds-num);
}
</style>

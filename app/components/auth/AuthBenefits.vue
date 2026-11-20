<script setup lang="ts">
import { ref } from 'vue'
import type { DsPieSegment } from '@/lib/ds/pie'
import type { DsGlyphKind } from '@/lib/ds/types'

/**
 * Encart des écrans d'auth : ce qu'apporte un compte gratuit, en trois tranches.
 * Survoler (ou focaliser) une ligne détache sa tranche du camembert, et inversement.
 */
type Benefit = { kind: DsGlyphKind; title: string; items: string[]; color: string }

const benefits: Benefit[] = [
  {
    kind: 'sondage',
    title: 'Interagir avec les contenus',
    items: ['résultats des sondages', 'commentaires', 'favoris', "j'aime"],
    color: 'var(--ds-t1)',
  },
  {
    kind: 'chaine',
    title: 'Publier vos propres contenus',
    items: ['articles', 'StatsData', 'sondages', 'votre chaîne'],
    color: 'var(--ds-t3)',
  },
  {
    kind: 'data',
    title: 'Télécharger les données',
    items: ['sources des StatsData', 'jeux de données ouverts'],
    color: 'var(--ds-t2)',
  },
]

const segments: DsPieSegment[] = benefits.map((b) => ({ value: 1, color: b.color, label: b.title }))
const active = ref<number | null>(null)
</script>

<template>
  <DsBox as="section" class="ds-bn" aria-labelledby="ds-bn-title">
    <div class="ds-bn__head">
      <DsLabel id="ds-bn-title">Compte gratuit · <b>ce qu'il vous ouvre</b></DsLabel>
    </div>

    <div class="ds-bn__body">
      <DsPie
        :segments="segments"
        :size="120"
        :selected="active"
        :detach="7"
        animate="mount"
        label="Trois avantages d'un compte gratuit"
        aria-hidden="true"
      />
      <ul class="ds-bn__list">
        <li
          v-for="(b, i) in benefits"
          :key="b.kind"
          :class="{ 'is-active': active === i }"
          @mouseenter="active = i"
          @mouseleave="active = null"
        >
          <DsSwatch :color="b.color" />
          <div class="min-w-0">
            <p class="ds-bn__title"><DsTypeGlyph :kind="b.kind" :size="14" />{{ b.title }}</p>
            <p class="ds-bn__items">{{ b.items.join(' · ') }}</p>
          </div>
        </li>
      </ul>
    </div>
  </DsBox>
</template>

<style scoped>
.ds-bn {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 22px;
}
.ds-bn__body {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 22px;
  align-items: center;
}
.ds-bn__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}
.ds-bn__list li {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 10px 8px;
  margin-inline: -8px;
  border-bottom: 2px solid var(--ds-divide);
  border-radius: 3px;
  transition: background 0.15s;
}
.ds-bn__list li:last-child {
  border-bottom-color: transparent;
}
.ds-bn__list li.is-active {
  background: var(--ds-tint);
}
.ds-bn__list :deep(.ds-swatch) {
  margin-top: 5px;
}
.ds-bn__title {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  color: var(--ds-text);
  font-size: 15.5px;
  font-weight: 700;
  line-height: 1.3;
}
.ds-bn__title :deep(svg) {
  color: var(--ds-link);
}
.ds-bn__items {
  margin: 3px 0 0;
  color: var(--ds-muted);
  font: 400 12.5px/1.45 var(--ds-num);
}
@media (max-width: 1180px) {
  .ds-bn__body {
    grid-template-columns: minmax(0, 1fr);
  }
  .ds-bn__body > :first-child {
    display: none;
  }
}
</style>

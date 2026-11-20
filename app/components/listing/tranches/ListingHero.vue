<script setup lang="ts">
import DsBox from '@/components/ds/DsBox.vue'
import DsHeading from '@/components/ds/DsHeading.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsPie from '@/components/ds/DsPie.vue'
import type { DsPieSegment } from '@/lib/ds/pie'

/**
 * Hero des listings (articles, StatsData…) : fil d'Ariane, étiquette, grand titre (slot `title`, accepte
 * <em>), chapô, et encart « le catalogue en chiffres » avec le camembert des
 * rubriques (masqué tant qu'il n'y a pas de rubrique).
 */
defineProps<{
  crumbs: { label: string; to?: string }[]
  lede: string
  stats: { label: string; value: string; small?: boolean }[]
  pie: DsPieSegment[]
  pieLabel: string
  caption?: string | null
}>()
</script>

<template>
  <section class="ds-max lhero" aria-labelledby="lhero-title">
    <nav class="lhero__crumbs" aria-label="Fil d'Ariane">
      <template v-for="(crumb, i) in crumbs" :key="crumb.label">
        <span v-if="i > 0" aria-hidden="true">/</span>
        <NuxtLink v-if="crumb.to" :to="crumb.to">{{ crumb.label }}</NuxtLink>
        <span v-else aria-current="page">{{ crumb.label }}</span>
      </template>
    </nav>

    <div class="lhero__grid">
      <div>
        <DsLabel><slot name="label" /></DsLabel>
        <DsHeading id="lhero-title" :level="1" size="display" class="lhero__title"
          ><slot name="title"
        /></DsHeading>
        <p class="lhero__lede">{{ lede }}</p>
      </div>

      <DsBox
        as="aside"
        class="lhero__stats"
        :class="{ 'lhero__stats--nopie': !pie.length }"
        aria-label="Le catalogue en chiffres"
      >
        <DsPie v-if="pie.length" :segments="pie" :size="120" :label="pieLabel" class="lhero__pie" />
        <dl>
          <div v-for="stat in stats" :key="stat.label">
            <dt>{{ stat.label }}</dt>
            <dd class="ds-tnum" :class="{ 'is-small': stat.small }">{{ stat.value }}</dd>
          </div>
        </dl>
        <p v-if="caption" class="lhero__cap">{{ caption }}</p>
      </DsBox>
    </div>
  </section>
</template>

<style scoped>
.lhero__crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 26px;
  color: var(--ds-muted);
  font: 500 12px var(--ds-num);
}
.lhero__crumbs a {
  color: inherit;
  text-decoration: none;
}
.lhero__crumbs a:hover {
  color: var(--ds-link);
}
.lhero__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  align-items: end;
  padding-block: 22px 36px;
}
@media (min-width: 981px) {
  .lhero__grid {
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    gap: 40px;
    padding-bottom: 44px;
  }
}
.lhero .lhero__title {
  margin: 14px 0 16px;
  /* un cran sous le H1 de l'accueil : le hero partage la ligne avec l'encart chiffré */
  font-size: clamp(44px, 6.2vw, 88px);
}
.lhero__lede {
  max-width: 52ch;
  margin: 0;
  color: var(--ds-muted);
  font-size: 18px;
  line-height: 1.6;
}
.lhero__stats {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 20px;
  align-items: center;
  padding: 22px;
}
.lhero__stats--nopie {
  grid-template-columns: minmax(0, 1fr);
}
@media (max-width: 420px) {
  .lhero__stats {
    grid-template-columns: minmax(0, 1fr);
  }
}
.lhero__pie {
  width: 120px;
}
.lhero__stats dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
  margin: 0;
}
.lhero__stats dt {
  color: var(--ds-muted);
  font: 500 10.5px/1.2 var(--ds-num);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.lhero__stats dd {
  margin: 6px 0 0;
  color: var(--ds-accent);
  font: 800 34px/1 var(--ds-display);
  font-stretch: 110%;
  letter-spacing: -0.02em;
}
.lhero__stats dd.is-small {
  color: var(--ds-text);
  font: 700 17px/1.1 var(--ds-ui);
}
.lhero__cap {
  grid-column: 1 / -1;
  margin: 0;
  padding-top: 12px;
  border-top: 2px solid var(--ds-divide);
  color: var(--ds-muted);
  font-size: 13.5px;
}
</style>

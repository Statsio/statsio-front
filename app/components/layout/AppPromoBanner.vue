<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePrefsStore } from '@/stores/prefs'
import { getBrandFromPath } from '@/data/brands'
import { loadPromoTicker } from '@/composables/useHeaderMegaMenuData'
import type { PromoTickerItem } from '@/components/layout/brands/header-nav.types'

const route = useRoute()
const { reducedMotion } = storeToRefs(usePrefsStore())

const brand = computed(() => getBrandFromPath(route.path))
// « Voir les tendances » renvoie vers le listing Articles (trié tendance par défaut) de la marque courante.
const ctaHref = computed(() => `${brand.value.contentBasePath}/articles`)

const { data } = useAsyncData(
  'promo-ticker',
  () => loadPromoTicker(brand.value.contentCategories, brand.value.contentBasePath),
  { watch: [() => brand.value.id], default: (): PromoTickerItem[] => [] },
)

const items = computed<PromoTickerItem[]>(() => data.value ?? [])

/**
 * Piste du bandeau défilant. Sans animation on ne rend qu'une passe (scroll manuel) ;
 * avec animation on répète la liste 4× — la keyframe translate de -50 % (soit 2 passes)
 * et retombe donc exactement sur un contenu identique → boucle sans saut.
 */
const MARQUEE_COPIES = 4
const trackItems = computed(() => {
  const list = items.value
  if (!list.length) return []
  const copies = reducedMotion.value ? 1 : MARQUEE_COPIES
  const out: { item: PromoTickerItem; key: string; clone: boolean }[] = []
  for (let copy = 0; copy < copies; copy++) {
    list.forEach((item, index) => out.push({ item, key: `${copy}-${index}`, clone: copy > 0 }))
  }
  return out
})

const sparkMax = (values: number[]) => Math.max(...values, 1)
</script>

<template>
  <section
    class="fixed inset-x-0 top-0 z-50 flex h-14 items-center overflow-hidden border-b border-slate-200 bg-white text-slate-900"
  >
    <div class="container flex items-center gap-4">
      <span class="flex shrink-0 items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-rose-600">
        <span
          class="h-1.5 w-1.5 rounded-full bg-rose-500"
          :class="reducedMotion ? '' : 'animate-pulse'"
        ></span>
        <span class="hidden sm:inline">Tendances</span>
      </span>

      <span class="hidden h-4 w-px shrink-0 bg-slate-200 sm:block"></span>

      <span v-if="!items.length" class="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-slate-500">
        Le meilleur de Statsio, mis à jour en continu
      </span>

      <div
        v-if="items.length"
        class="promo-marquee relative min-w-0 flex-1"
        :class="reducedMotion ? 'promo-scroll overflow-x-auto' : 'overflow-hidden'"
      >
        <div class="promo-track flex w-max items-center" :class="{ 'promo-track--run': !reducedMotion }">
          <component
            :is="entry.item.href.startsWith('/') ? RouterLink : 'a'"
            v-for="entry in trackItems"
            :key="entry.key"
            :to="entry.item.href.startsWith('/') ? entry.item.href : undefined"
            :href="entry.item.href.startsWith('/') ? undefined : entry.item.href"
            :aria-hidden="entry.clone ? 'true' : undefined"
            :tabindex="entry.clone ? -1 : undefined"
            class="promo-item flex shrink-0 items-center gap-2.5 text-slate-900 transition hover:text-primary"
          >
            <span
              class="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.05em]"
              :style="{ color: entry.item.tagColor }"
            >
              {{ entry.item.tag }}
            </span>
            <span class="whitespace-nowrap text-[12.5px] font-bold">{{ entry.item.title }}</span>

            <template v-if="entry.item.kind === 'statsdata' && entry.item.kpi">
              <span class="flex shrink-0 items-baseline gap-1">
                <span class="font-mono text-[12px] font-bold text-slate-900">{{ entry.item.kpi }}</span>
                <span class="font-mono text-[9px] font-semibold text-emerald-600">{{ entry.item.kpiLabel }}</span>
              </span>
              <span v-if="entry.item.sparkline?.length" class="flex h-3.5 shrink-0 items-end gap-[1.5px]">
                <span
                  v-for="(value, index) in entry.item.sparkline"
                  :key="index"
                  class="w-[2.5px] rounded-t-sm"
                  :class="index >= (entry.item.sparkline?.length ?? 0) - 3 ? 'bg-primary' : 'bg-slate-200'"
                  :style="{ height: Math.max(15, Math.round((value / sparkMax(entry.item.sparkline ?? [])) * 100)) + '%' }"
                ></span>
              </span>
            </template>

            <template v-if="entry.item.kind === 'survey' && entry.item.percent != null">
              <span class="h-[5px] w-16 shrink-0 overflow-hidden rounded-full bg-slate-200">
                <span
                  class="block h-full rounded-full bg-[linear-gradient(90deg,var(--color-primary),var(--color-accent))]"
                  :style="{ width: Math.min(100, Math.max(0, entry.item.percent)) + '%' }"
                ></span>
              </span>
              <span class="shrink-0 font-mono text-[10.5px] font-bold text-primary">{{ entry.item.percent }}%</span>
            </template>
          </component>
        </div>
      </div>

      <RouterLink
        :to="ctaHref"
        class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] px-3 py-1.5 text-[11.5px] font-extrabold text-white transition hover:opacity-90"
      >
        Voir les tendances →
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.promo-scroll {
  scrollbar-width: none;
}
.promo-scroll::-webkit-scrollbar {
  display: none;
}

/* Espacement porté par l'item (et non un `gap` flex) pour que translateX(-50%) tombe
   pile sur une frontière de copie → boucle sans saccade. */
.promo-item {
  margin-inline-end: 2.75rem;
}

.promo-track--run {
  animation: promo-marquee 34s linear infinite;
}

.promo-marquee:hover .promo-track--run,
.promo-marquee:focus-within .promo-track--run {
  animation-play-state: paused;
}

@keyframes promo-marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .promo-track--run {
    animation: none;
  }
}
</style>

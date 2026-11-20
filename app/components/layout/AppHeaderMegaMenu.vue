<script setup lang="ts">
import { RouterLink } from 'vue-router'
import MegaMenuDocCard from '@/components/layout/MegaMenuDocCard.vue'
import type { HeaderNavItem } from '@/components/layout/brands/header-nav.types'

withDefaults(
  defineProps<{
    item: HeaderNavItem
    /** Espacements réduits pour l'intégration dans l'accordéon du menu burger mobile. */
    dense?: boolean
  }>(),
  { dense: false },
)

const sparklineMax = (values: number[]) => Math.max(...values, 1)

const isInternal = (href?: string) => !!href && href.startsWith('/')

const formatCount = (count?: number) => {
  if (count == null) return ''
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)} k`
  return String(count)
}
</script>

<template>
  <div
    class="ds-mm grid gap-6"
    :class="[
      item.categories.length ? 'lg:grid-cols-[210px_1fr]' : 'lg:grid-cols-1',
      dense ? '' : 'mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:gap-11 lg:px-10 lg:py-10',
    ]"
  >
    <aside v-if="item.categories.length" class="min-w-0">
      <p class="ds-mm-label mb-3 px-2.5">
        {{ item.categoryHeading ?? 'Catégories' }}
      </p>
      <div class="flex flex-col gap-px">
        <component
          :is="isInternal(category.href) ? RouterLink : 'a'"
          v-for="category in item.categories"
          :key="category.name"
          :to="isInternal(category.href) ? category.href : undefined"
          :href="isInternal(category.href) ? undefined : (category.href ?? undefined)"
          class="ds-mm-cat flex items-center justify-between gap-2.5 px-2.5 py-2 text-[13.5px] font-semibold"
        >
          <span class="flex min-w-0 items-center gap-2.5">
            <CategoryIcon :category="category.name" :color="category.color" :size="15" :dot-size="7" />
            <span class="truncate">{{ category.name }}</span>
          </span>
          <span v-if="category.count != null" class="ds-mm-count shrink-0">
            {{ formatCount(category.count) }}
          </span>
        </component>
      </div>
      <component
        :is="isInternal(item.href) ? RouterLink : 'a'"
        :to="isInternal(item.href) ? item.href : undefined"
        :href="isInternal(item.href) ? undefined : item.href"
        class="ds-mm-all mt-3 block px-2.5 py-2 text-[13.5px] font-bold"
      >
        Tout voir →
      </component>
    </aside>

    <div class="min-w-0">
      <p
        v-if="!(item.menu.variant === 'doc' && item.menu.sections?.length)"
        class="ds-mm-label mb-4"
      >
        {{ item.menuHeading }}
      </p>

      <p v-if="item.menu.cards.length === 0" class="ds-mm-muted text-sm">Contenu à venir.</p>

      <!-- Articles / formats éditoriaux -->
      <template v-else-if="item.menu.variant === 'doc'">
        <!-- Groupes (ex. « En ce moment » / « Ce soir ») -->
        <div v-if="item.menu.sections?.length" class="flex flex-col gap-6">
          <div v-for="section in item.menu.sections" :key="section.label">
            <p class="ds-mm-label mb-3">{{ section.label }}</p>
            <div class="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              <MegaMenuDocCard v-for="card in section.cards" :key="section.label + card.publisher + card.title" :card="card" />
            </div>
          </div>
        </div>
        <div v-else class="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <MegaMenuDocCard v-for="card in item.menu.cards" :key="card.title" :card="card" />
        </div>
      </template>

      <!-- StatsData / séries -->
      <div v-else-if="item.menu.variant === 'bar'" class="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <component
          :is="isInternal(card.href) ? RouterLink : 'a'"
          v-for="card in item.menu.cards"
          :key="card.title"
          :to="isInternal(card.href) ? card.href : undefined"
          :href="isInternal(card.href) ? undefined : (card.href ?? '#')"
          class="flex min-w-0 flex-col ds-mm-card p-3.5"
        >
          <div class="mb-2 flex items-center gap-2">
            <span
              v-if="card.theme"
              class="ds-mm-tag px-1.5 py-0.5"
              :style="{ color: card.themeColor ?? '#7c3aed' }"
            >
              {{ card.theme }}
            </span>
            <span
              v-else-if="card.logoUrl"
              class="ds-mm-logo flex h-5 w-8 shrink-0 items-center justify-center overflow-hidden"
            >
              <img :src="card.logoUrl" :alt="card.title" class="h-full w-full object-contain" />
            </span>
            <span v-else class="text-base">{{ card.icon }}</span>
            <span v-if="card.freq" class="ds-mm-count flex items-center gap-1.5">
              <span
                class="h-[6px] w-[6px] rounded-[100%_0_0_0]"
                :class="card.freqLive ? 'bg-emerald-500' : 'bg-[var(--ds-context)]'"
              ></span>
              {{ card.freq }}
            </span>
          </div>
          <div class="line-clamp-2 min-h-[2.4em] text-[13px] font-extrabold leading-snug ds-mm-title">
            {{ card.title }}
          </div>
          <div v-if="card.kpi" class="mt-2.5 flex items-baseline gap-2">
            <span class="font-mono text-[15px] font-semibold ds-mm-title">{{ card.kpi }}</span>
            <span v-if="card.kpiDelta" class="ds-mm-count">{{ card.kpiDelta }}</span>
          </div>
          <div class="mt-2 flex h-[22px] items-end gap-[2px]">
            <span
              v-for="(value, index) in card.sparkline"
              :key="index"
              class="min-w-0 flex-1 rounded-[1px]"
              :class="index >= card.sparkline.length - 3 ? 'ds-mm-bar is-hot' : 'ds-mm-bar'"
              :style="{ height: Math.max(6, Math.round((value / sparklineMax(card.sparkline)) * 100)) + '%' }"
            ></span>
          </div>
          <div v-if="!card.kpi" class="ds-mm-muted mt-2 text-[11px]">{{ card.meta }}</div>
        </component>
      </div>

      <!-- Sondages -->
      <div v-else-if="item.menu.variant === 'pie'" class="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <component
          :is="isInternal(card.href) ? RouterLink : 'a'"
          v-for="card in item.menu.cards"
          :key="card.question"
          :to="isInternal(card.href) ? card.href : undefined"
          :href="isInternal(card.href) ? undefined : (card.href ?? '#')"
          class="flex min-w-0 flex-col ds-mm-card p-3.5"
        >
          <div class="mb-2 flex items-center gap-2">
            <span
              v-if="card.kind"
              class="ds-mm-tag px-1.5 py-0.5"
              :style="{ color: card.kindColor ?? '#7c3aed' }"
            >
              {{ card.kind }}
            </span>
            <span
              v-if="card.statusOpen != null"
              class="flex items-center gap-1.5 font-mono text-[9px]"
              :class="card.statusOpen ? 'text-emerald-700' : 'ds-mm-muted'"
            >
              <span
                class="h-[6px] w-[6px] rounded-[100%_0_0_0]"
                :class="card.statusOpen ? 'bg-emerald-500' : 'bg-[var(--ds-context)]'"
              ></span>
              {{ card.statusOpen ? 'OUVERT' : 'CLOS' }}
            </span>
          </div>
          <div class="line-clamp-2 min-h-[2.4em] text-[13px] font-extrabold leading-snug ds-mm-title">
            {{ card.question }}
          </div>
          <div class="ds-mm-track mt-3 h-[6px] overflow-hidden">
            <div
              class="ds-mm-fill h-full"
              :style="{ width: Math.min(100, Math.max(0, card.percent ?? 0)) + '%' }"
            ></div>
          </div>
          <div class="ds-mm-muted mt-1.5 text-[11px] font-semibold">{{ card.lead ?? card.voteCount }}</div>
        </component>
      </div>

      <!-- Chaînes -->
      <div v-else class="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <component
          :is="isInternal(card.href) ? RouterLink : 'a'"
          v-for="card in item.menu.cards"
          :key="card.name"
          :to="isInternal(card.href) ? card.href : undefined"
          :href="isInternal(card.href) ? undefined : (card.href ?? '#')"
          class="flex min-w-0 items-center gap-3 ds-mm-card p-3.5"
        >
          <span
            class="ds-mm-logo flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden text-[11px] font-extrabold"
          >
            <img v-if="card.logoUrl" :src="card.logoUrl" :alt="card.name" class="h-full w-full object-cover" />
            <template v-else>{{ card.initials }}</template>
          </span>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="truncate text-[13px] font-extrabold ds-mm-title">{{ card.name }}</span>
              <span v-if="card.verified" class="ds-mm-link shrink-0 text-[11px]" title="Chaîne vérifiée">✔</span>
            </div>
            <div class="ds-mm-count mt-0.5">
              <template v-if="card.followers">{{ card.followers }} abonnés</template>
              <template v-else>{{ card.meta }}</template>
            </div>
          </div>
        </component>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ds-mm {
  color: var(--ds-text);
  font-family: var(--ds-ui);
}
.ds-mm-label {
  color: var(--ds-muted);
  font: 500 10.5px/1.3 var(--ds-num);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.ds-mm-cat {
  border: 2px solid transparent;
  border-radius: 4px;
  color: var(--ds-text);
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;
}
.ds-mm-cat:hover {
  border-color: var(--ds-divide);
  background: var(--ds-tint);
  color: var(--ds-link);
}
.ds-mm-count {
  color: var(--ds-faint);
  font: 500 10.5px/1.3 var(--ds-num);
}
.ds-mm-all,
.ds-mm-link {
  color: var(--ds-link);
}
.ds-mm-all:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}
.ds-mm-muted {
  color: var(--ds-muted);
}
.ds-mm-title {
  color: var(--ds-text);
}
.ds-mm-card {
  border: 2px solid var(--ds-divide);
  border-radius: 4px;
  background: var(--ds-surface);
  transition:
    border-color 0.15s,
    transform 0.15s,
    box-shadow 0.15s;
}
.ds-mm-card:hover {
  border-color: var(--ds-ol);
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--ds-sh);
}
.ds-mm-tag {
  border: 1.5px solid currentColor;
  border-radius: 2px;
  font: 500 9.5px/1 var(--ds-num);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.ds-mm-logo {
  border: 2px solid var(--ds-divide);
  border-radius: 3px;
  background: var(--ds-surface);
  color: var(--ds-text);
}
.ds-mm-bar {
  background: var(--ds-line);
}
.ds-mm-bar.is-hot {
  background: var(--ds-t1);
}
.ds-mm-track {
  border-radius: 0 2px 2px 0;
  background: var(--ds-line);
}
.ds-mm-fill {
  background: var(--ds-t1);
}
</style>

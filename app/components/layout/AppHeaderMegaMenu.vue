<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { HeaderNavItem } from '@/components/layout/brands/header-nav.types'

defineProps<{
  item: HeaderNavItem
}>()

const sparklineMax = (values: number[]) => Math.max(...values, 1)

const isInternal = (href?: string) => !!href && href.startsWith('/')

const formatCount = (count?: number) => {
  if (count == null) return ''
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)} k`
  return String(count)
}
</script>

<template>
  <div class="container grid gap-8 py-8 lg:grid-cols-[210px_1fr] lg:gap-11 lg:py-10">
    <aside v-if="item.categories.length" class="min-w-0">
      <p class="mb-3 px-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {{ item.categoryHeading ?? 'Catégories' }}
      </p>
      <div class="flex flex-col gap-px">
        <component
          :is="isInternal(category.href) ? RouterLink : 'a'"
          v-for="category in item.categories"
          :key="category.name"
          :to="isInternal(category.href) ? category.href : undefined"
          :href="isInternal(category.href) ? undefined : (category.href ?? undefined)"
          class="flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-primary"
        >
          <span class="flex min-w-0 items-center gap-2.5">
            <span class="h-[7px] w-[7px] shrink-0 rounded-full" :style="{ background: category.color }"></span>
            <span class="truncate">{{ category.name }}</span>
          </span>
          <span v-if="category.count != null" class="shrink-0 font-mono text-[10.5px] text-slate-400">
            {{ formatCount(category.count) }}
          </span>
        </component>
      </div>
      <component
        :is="isInternal(item.href) ? RouterLink : 'a'"
        :to="isInternal(item.href) ? item.href : undefined"
        :href="isInternal(item.href) ? undefined : item.href"
        class="mt-3 block px-2.5 py-2 text-[13px] font-bold text-primary hover:underline"
      >
        Tout voir →
      </component>
    </aside>

    <div class="min-w-0">
      <p class="mb-4 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">{{ item.menuHeading }}</p>

      <p v-if="item.menu.cards.length === 0" class="text-sm text-slate-400">Contenu à venir.</p>

      <!-- Articles / formats éditoriaux -->
      <div v-else-if="item.menu.variant === 'doc'" class="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <component
          :is="isInternal(card.href) ? RouterLink : 'a'"
          v-for="card in item.menu.cards"
          :key="card.title"
          :to="isInternal(card.href) ? card.href : undefined"
          :href="isInternal(card.href) ? undefined : (card.href ?? '#')"
          class="flex min-w-0 flex-col rounded-2xl border border-slate-100 bg-slate-50 p-3.5 transition hover:border-primary/20 hover:bg-primary/5"
        >
          <div class="mb-2 flex items-center gap-2">
            <span
              class="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em]"
              :style="{ color: card.tagColor ?? '#7c3aed' }"
            >
              {{ card.tag }}
            </span>
            <span v-if="card.readingLabel" class="font-mono text-[9.5px] text-slate-400">{{ card.readingLabel }}</span>
          </div>
          <div class="line-clamp-2 min-h-[2.4em] text-[13px] font-extrabold leading-snug text-slate-950">
            {{ card.title }}
          </div>
          <div class="mt-3 flex items-center gap-2">
            <span
              v-if="card.publisher"
              class="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] text-[8px] font-extrabold text-white"
              :class="card.isChannel ? 'rounded-md' : 'rounded-full'"
            >
              <img v-if="card.logoUrl" :src="card.logoUrl" :alt="card.publisher" class="h-full w-full object-cover" />
              <template v-else>{{ card.initials }}</template>
            </span>
            <span class="min-w-0 truncate text-[11px] font-semibold text-slate-500">
              <template v-if="card.publisher">{{ card.publisher }} · </template>{{ card.meta }}
            </span>
          </div>
        </component>
      </div>

      <!-- StatsData / séries -->
      <div v-else-if="item.menu.variant === 'bar'" class="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <component
          :is="isInternal(card.href) ? RouterLink : 'a'"
          v-for="card in item.menu.cards"
          :key="card.title"
          :to="isInternal(card.href) ? card.href : undefined"
          :href="isInternal(card.href) ? undefined : (card.href ?? '#')"
          class="flex min-w-0 flex-col rounded-2xl border border-slate-100 bg-slate-50 p-3.5 transition hover:border-primary/20 hover:bg-primary/5"
        >
          <div class="mb-2 flex items-center gap-2">
            <span
              v-if="card.theme"
              class="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em]"
              :style="{ color: card.themeColor ?? '#7c3aed' }"
            >
              {{ card.theme }}
            </span>
            <span v-else class="text-base">{{ card.icon }}</span>
            <span v-if="card.freq" class="flex items-center gap-1.5 font-mono text-[9px] text-slate-400">
              <span
                class="h-[5px] w-[5px] rounded-full"
                :class="card.freqLive ? 'bg-emerald-500' : 'bg-slate-300'"
              ></span>
              {{ card.freq }}
            </span>
          </div>
          <div class="line-clamp-2 min-h-[2.4em] text-[13px] font-extrabold leading-snug text-slate-950">
            {{ card.title }}
          </div>
          <div v-if="card.kpi" class="mt-2.5 flex items-baseline gap-2">
            <span class="font-mono text-[15px] font-semibold text-slate-950">{{ card.kpi }}</span>
            <span v-if="card.kpiDelta" class="font-mono text-[10px] font-semibold text-slate-400">{{ card.kpiDelta }}</span>
          </div>
          <div class="mt-2 flex h-[22px] items-end gap-[2px]">
            <span
              v-for="(value, index) in card.sparkline"
              :key="index"
              class="min-w-0 flex-1 rounded-sm"
              :class="index >= card.sparkline.length - 3 ? 'bg-primary' : 'bg-slate-200'"
              :style="{ height: Math.max(6, Math.round((value / sparklineMax(card.sparkline)) * 100)) + '%' }"
            ></span>
          </div>
          <div v-if="!card.kpi" class="mt-2 text-[11px] text-slate-500">{{ card.meta }}</div>
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
          class="flex min-w-0 flex-col rounded-2xl border border-slate-100 bg-slate-50 p-3.5 transition hover:border-primary/20 hover:bg-primary/5"
        >
          <div class="mb-2 flex items-center gap-2">
            <span
              v-if="card.kind"
              class="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em]"
              :style="{ color: card.kindColor ?? '#7c3aed' }"
            >
              {{ card.kind }}
            </span>
            <span
              v-if="card.statusOpen != null"
              class="flex items-center gap-1.5 font-mono text-[9px]"
              :class="card.statusOpen ? 'text-emerald-700' : 'text-slate-400'"
            >
              <span
                class="h-[5px] w-[5px] rounded-full"
                :class="card.statusOpen ? 'bg-emerald-500' : 'bg-slate-300'"
              ></span>
              {{ card.statusOpen ? 'OUVERT' : 'CLOS' }}
            </span>
          </div>
          <div class="line-clamp-2 min-h-[2.4em] text-[13px] font-extrabold leading-snug text-slate-950">
            {{ card.question }}
          </div>
          <div class="mt-3 h-[7px] overflow-hidden rounded-full bg-slate-200">
            <div
              class="h-full rounded-full bg-[linear-gradient(90deg,var(--color-primary),var(--color-accent))]"
              :style="{ width: Math.min(100, Math.max(0, card.percent ?? 0)) + '%' }"
            ></div>
          </div>
          <div class="mt-1.5 text-[11px] font-semibold text-slate-500">{{ card.lead ?? card.voteCount }}</div>
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
          class="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 transition hover:border-primary/20 hover:bg-primary/5"
        >
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl text-[11px] font-extrabold text-white"
            :style="{ background: `linear-gradient(135deg, ${card.avatarPrimary}, ${card.avatarSecondary})` }"
          >
            <img v-if="card.logoUrl" :src="card.logoUrl" :alt="card.name" class="h-full w-full object-cover" />
            <template v-else>{{ card.initials }}</template>
          </span>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="truncate text-[13px] font-extrabold text-slate-950">{{ card.name }}</span>
              <span v-if="card.verified" class="shrink-0 text-[11px] text-accent" title="Chaîne vérifiée">✔</span>
            </div>
            <div class="mt-0.5 font-mono text-[10px] text-slate-500">
              <template v-if="card.followers">{{ card.followers }} abonnés</template>
              <template v-else>{{ card.meta }}</template>
            </div>
          </div>
        </component>
      </div>
    </div>
  </div>
</template>

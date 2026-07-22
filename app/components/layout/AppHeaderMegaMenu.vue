<script setup lang="ts">
import type { HeaderNavItem } from '@/components/layout/brands/header-nav.types'

defineProps<{
  item: HeaderNavItem
}>()

const sparklineMax = (values: number[]) => Math.max(...values)
</script>

<template>
  <div class="container flex gap-10 py-8 lg:py-10">
    <aside v-if="item.categories.length" class="w-[200px] shrink-0">
      <p class="px-2.5 pb-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400">Catégories</p>
      <div class="flex flex-col gap-0.5">
        <div
          v-for="category in item.categories"
          :key="category.name"
          class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition hover:bg-slate-50"
        >
          <span class="h-[7px] w-[7px] shrink-0 rounded-full" :style="{ background: category.color }"></span>
          <span class="text-[13.5px] font-semibold text-slate-700">{{ category.name }}</span>
        </div>
      </div>
    </aside>

    <div class="min-w-0 flex-1">
      <p class="mb-4 text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400">{{ item.menuHeading }}</p>

      <p v-if="item.menu.cards.length === 0" class="text-sm text-slate-400">Contenu à venir.</p>

      <div v-else-if="item.menu.variant === 'doc'" class="grid grid-cols-3 gap-[22px]">
        <div v-for="card in item.menu.cards" :key="card.title" class="min-w-0 cursor-pointer">
          <div
            class="mb-3 h-[120px] rounded-xl bg-slate-100"
            style="background-image: repeating-linear-gradient(45deg, rgba(15,23,42,0.05) 0px, rgba(15,23,42,0.05) 8px, transparent 8px, transparent 16px)"
          ></div>
          <span class="text-[11px] font-bold uppercase tracking-wide text-primary">{{ card.tag }}</span>
          <div class="mt-1.5 mb-2 line-clamp-2 text-[15px] font-bold leading-snug text-slate-950">{{ card.title }}</div>
          <div class="text-xs text-slate-500">{{ card.meta }}</div>
        </div>
      </div>

      <div v-else-if="item.menu.variant === 'bar'" class="grid grid-cols-3 gap-[22px]">
        <div
          v-for="card in item.menu.cards"
          :key="card.title"
          class="min-w-0 cursor-pointer rounded-2xl border border-slate-200 p-[18px]"
        >
          <div class="mb-3 flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-primary/10 text-base">
            {{ card.icon }}
          </div>
          <div class="mb-2.5 line-clamp-2 text-[14.5px] font-bold leading-snug text-slate-950">{{ card.title }}</div>
          <div class="mb-2.5 flex h-7 items-end gap-[3px]">
            <span
              v-for="(value, index) in card.sparkline"
              :key="index"
              class="flex-1 rounded-sm"
              :class="index === card.sparkline.length - 1 ? 'bg-primary' : 'bg-slate-200'"
              :style="{ height: Math.max(4, Math.round((value / sparklineMax(card.sparkline)) * 100)) + '%' }"
            ></span>
          </div>
          <div class="text-[11.5px] text-slate-500">{{ card.meta }}</div>
        </div>
      </div>

      <div v-else-if="item.menu.variant === 'pie'" class="grid grid-cols-2 gap-[22px]">
        <div v-for="card in item.menu.cards" :key="card.question" class="min-w-0 cursor-pointer rounded-2xl bg-slate-950 p-6 text-white">
          <div class="mb-2 text-[15.5px] font-bold leading-snug">{{ card.question }}</div>
          <div :class="card.splitA && card.splitB ? 'mb-4' : ''" class="text-xs text-white/50">{{ card.voteCount }}</div>
          <template v-if="card.splitA && card.splitB">
            <div class="mb-2.5 flex h-[9px] w-full overflow-hidden rounded-full bg-white/15">
              <span class="bg-primary" :style="{ width: card.splitA.percent + '%' }"></span>
              <span class="bg-accent" :style="{ width: card.splitB.percent + '%' }"></span>
            </div>
            <div class="flex justify-between text-xs font-semibold text-white/75">
              <span>{{ card.splitA.label }} {{ card.splitA.percent }}%</span>
              <span>{{ card.splitB.label }} {{ card.splitB.percent }}%</span>
            </div>
          </template>
        </div>
      </div>

      <div v-else class="grid grid-cols-3 gap-[22px]">
        <div
          v-for="card in item.menu.cards"
          :key="card.name"
          class="flex min-w-0 cursor-pointer flex-col items-start gap-3 rounded-2xl bg-slate-50 p-5"
        >
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[11px] text-sm font-bold text-white"
            :style="card.logoUrl ? undefined : { background: `linear-gradient(135deg, ${card.avatarPrimary}, ${card.avatarSecondary})` }"
          >
            <img v-if="card.logoUrl" :src="card.logoUrl" :alt="card.name" class="h-full w-full object-cover" />
            <template v-else>{{ card.initials }}</template>
          </div>
          <div>
            <div class="mb-1 text-[14.5px] font-bold text-slate-950">{{ card.name }}</div>
            <div class="text-xs text-slate-500">{{ card.meta }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

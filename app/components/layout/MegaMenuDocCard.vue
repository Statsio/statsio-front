<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { MegaMenuArticleCard } from '@/components/layout/brands/header-nav.types'

defineProps<{
  card: MegaMenuArticleCard
}>()

const isInternal = (href?: string) => !!href && href.startsWith('/')
</script>

<template>
  <component
    :is="isInternal(card.href) ? RouterLink : 'a'"
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
        class="flex shrink-0 items-center justify-center overflow-hidden text-[8px] font-extrabold text-white"
        :class="[
          card.isChannel ? 'rounded-md' : 'rounded-full',
          card.logoUrl && card.isChannel
            ? 'h-5 w-8 bg-white ring-1 ring-slate-200'
            : 'h-5 w-5 bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))]',
        ]"
      >
        <img
          v-if="card.logoUrl"
          :src="card.logoUrl"
          :alt="card.publisher"
          class="h-full w-full"
          :class="card.isChannel ? 'object-contain' : 'object-cover'"
        />
        <template v-else>{{ card.initials }}</template>
      </span>
      <span class="min-w-0 truncate text-[11px] font-semibold text-slate-500">
        <template v-if="card.publisher">{{ card.publisher }} · </template>{{ card.meta }}
      </span>
    </div>
  </component>
</template>

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
    class="ds-doc-card flex min-w-0 flex-col p-3.5"
  >
    <div class="mb-2 flex items-center gap-2">
      <span
        class="ds-doc-card__tag px-1.5 py-0.5"
        :style="{ color: card.tagColor ?? '#7c3aed' }"
      >
        {{ card.tag }}
      </span>
      <span v-if="card.readingLabel" class="ds-doc-card__meta">{{ card.readingLabel }}</span>
    </div>
    <div class="line-clamp-2 min-h-[2.4em] text-[13px] font-extrabold leading-snug ds-doc-card__title">
      {{ card.title }}
    </div>
    <div class="mt-3 flex items-center gap-2">
      <span
        v-if="card.publisher"
        class="flex shrink-0 items-center justify-center overflow-hidden text-[8px] font-extrabold text-white"
        :class="[
          card.isChannel ? 'rounded-md' : 'rounded-full',
          card.logoUrl && card.isChannel
            ? 'ds-doc-card__logo h-5 w-8'
            : 'h-5 w-5 bg-[var(--ds-t1)]',
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
      <span class="ds-doc-card__muted min-w-0 truncate text-[11px] font-semibold">
        <template v-if="card.publisher">{{ card.publisher }} · </template>{{ card.meta }}
      </span>
    </div>
  </component>
</template>

<style scoped>
.ds-doc-card {
  border: 2px solid var(--ds-divide);
  border-radius: 4px;
  background: var(--ds-surface);
  color: var(--ds-text);
  transition:
    border-color 0.15s,
    transform 0.15s,
    box-shadow 0.15s;
}
.ds-doc-card:hover {
  border-color: var(--ds-ol);
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--ds-sh);
}
.ds-doc-card__tag {
  border: 1.5px solid currentColor;
  border-radius: 2px;
  font: 500 9.5px/1 var(--ds-num);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.ds-doc-card__meta {
  color: var(--ds-faint);
  font: 400 10px var(--ds-num);
}
.ds-doc-card__title {
  color: var(--ds-text);
}
.ds-doc-card__muted {
  color: var(--ds-muted);
}
.ds-doc-card__logo {
  border: 1.5px solid var(--ds-divide);
  background: var(--ds-surface);
}
</style>

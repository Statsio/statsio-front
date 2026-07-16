<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { ArticleSummary } from '@/data/articles'
import { getCategoryColorClass } from '@/lib/articleCategoryColor'

const props = defineProps<{
  article: ArticleSummary
}>()

const categoryClass = computed(() => getCategoryColorClass(props.article.category))
</script>

<template>
  <RouterLink :to="`/articles/${article.slug}`" class="card group flex flex-col transition hover:-translate-y-0.5 hover:shadow-md">
    <div class="relative h-36 shrink-0 overflow-hidden bg-slate-100">
      <img
        v-if="article.image"
        :src="article.image"
        :alt="article.title"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
      />
      <div
        v-else
        class="mono flex h-full w-full items-center justify-center bg-[var(--color-primary)]/5 text-xs text-[var(--color-primary)]"
        aria-hidden="true"
      >
        {{ article.category }}
      </div>
    </div>
    <div class="flex flex-1 flex-col gap-2 p-4">
      <span class="text-[11px] font-bold uppercase tracking-[0.05em]" :class="categoryClass">{{ article.category }}</span>
      <h3 class="text-base font-bold leading-snug text-slate-900">{{ article.title }}</h3>
      <p class="mt-auto text-xs text-slate-500">{{ article.author }} · {{ article.readTime }}</p>
    </div>
  </RouterLink>
</template>

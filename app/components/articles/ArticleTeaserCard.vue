<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { StatsDataDocument } from '@/api/studio'
import { getCategoryColorClass } from '@/lib/articleCategoryColor'
import { publicContentPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'

const props = defineProps<{
  article: StatsDataDocument
}>()

const category = computed(() => props.article.categories?.[0] ?? 'Article')
const categoryClass = computed(() => getCategoryColorClass(category.value))

const basePath = useContentBasePath()
const detailPath = computed(() => publicContentPath('article', props.article.slug ?? '', basePath.value))
</script>

<template>
  <RouterLink :to="detailPath" class="card group flex flex-col transition hover:-translate-y-0.5 hover:shadow-md">
    <div class="relative h-36 shrink-0 overflow-hidden bg-slate-100">
      <img
        v-if="article.thumbnail_url"
        :src="article.thumbnail_url"
        :alt="article.title"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
      />
      <div
        v-else
        class="mono flex h-full w-full items-center justify-center bg-[var(--color-primary)]/5 text-xs text-[var(--color-primary)]"
        aria-hidden="true"
      >
        {{ category }}
      </div>
    </div>
    <div class="flex flex-1 flex-col gap-2 p-4">
      <span class="text-[11px] font-bold uppercase tracking-[0.05em]" :class="categoryClass">{{ category }}</span>
      <h3 class="text-base font-bold leading-snug text-slate-900">{{ article.title }}</h3>
      <p class="mt-auto text-xs text-slate-500">{{ article.author?.name ?? 'Anonyme' }}</p>
    </div>
  </RouterLink>
</template>

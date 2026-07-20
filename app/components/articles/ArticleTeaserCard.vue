<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { StatsDataDocument } from '@/api/studio'
import { getCategoryColorClass } from '@/lib/articleCategoryColor'
import { publicContentPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'

const props = withDefaults(
  defineProps<{
    article: StatsDataDocument
    size?: 'normal' | 'hero'
  }>(),
  { size: 'normal' },
)

const category = computed(() => props.article.categories?.[0] ?? 'Article')
const categoryClass = computed(() => getCategoryColorClass(category.value))

const basePath = useContentBasePath()
const detailPath = computed(() => publicContentPath('article', props.article.slug ?? '', basePath.value))
</script>

<template>
  <RouterLink :to="detailPath" class="card group flex flex-col transition hover:-translate-y-0.5 hover:shadow-md">
    <div
      class="relative shrink-0 overflow-hidden bg-slate-100"
      :class="size === 'hero' ? 'h-[220px]' : 'h-36'"
    >
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
      <span
        v-if="size === 'hero'"
        class="absolute left-3.5 top-3.5 rounded-full bg-[#18181f]/55 px-2.5 py-1 text-[10.5px] font-bold tracking-[0.03em] text-white"
      >
        À LA UNE
      </span>
    </div>
    <div class="flex flex-1 flex-col gap-2 p-4" :class="size === 'hero' ? 'p-5' : 'p-4'">
      <span class="text-[11px] font-bold uppercase tracking-[0.05em]" :class="categoryClass">{{ category }}</span>
      <h3 class="font-bold leading-snug text-slate-900" :class="size === 'hero' ? 'text-xl' : 'text-base'">{{ article.title }}</h3>
      <p class="mt-auto text-xs text-slate-500">{{ article.author?.name ?? 'Anonyme' }}</p>
    </div>
  </RouterLink>
</template>

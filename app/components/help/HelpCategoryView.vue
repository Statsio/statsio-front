<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { fetchHelpCategory } from '@/api/help'

const route = useRoute()
const slug = computed(() => String(route.params.category))

const { data, error } = await useAsyncData('help-category', () => fetchHelpCategory(slug.value), {
  watch: [slug],
})

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Catégorie introuvable', fatal: true })
}

const category = computed(() => data.value!.category)
const articles = computed(() => data.value!.articles)
</script>

<template>
  <main class="section container pb-24">
    <div class="mb-6 flex items-center gap-2 text-[13px] text-slate-500">
      <NuxtLink to="/aide" class="font-semibold hover:text-[var(--color-primary)]">Centre d'aide</NuxtLink>
      <span>/</span>
      <span class="font-bold text-slate-900">{{ category.name }}</span>
    </div>

    <div class="mb-9 flex items-center gap-4">
      <div
        class="flex h-13 w-13 items-center justify-center rounded-2xl"
        :style="{ background: `color-mix(in srgb, ${category.color ?? 'var(--color-primary)'} 14%, white)` }"
      >
        <CategoryIcon :icon-name="category.icon" :color="category.color ?? 'var(--color-primary)'" :size="24" />
      </div>
      <div>
        <h1 class="mb-1 text-[28px] font-extrabold text-slate-900">{{ category.name }}</h1>
        <p class="text-[14.5px] text-slate-500">{{ category.description }}</p>
      </div>
    </div>

    <div class="flex flex-col border-t border-slate-200">
      <NuxtLink
        v-for="a in articles"
        :key="a.slug"
        :to="`/aide/${category.slug}/${a.slug}`"
        class="u-hover flex items-center justify-between gap-4 border-b border-slate-200 py-5"
      >
        <div>
          <div class="u-card-title mb-1 text-[15.5px] font-bold text-slate-900">{{ a.title }}</div>
          <div class="text-[13px] text-slate-500">{{ a.excerpt }}</div>
        </div>
        <span class="shrink-0 text-sm text-slate-300">→</span>
      </NuxtLink>
      <p v-if="articles.length === 0" class="py-10 text-center text-sm text-slate-500">
        Aucun article dans cette catégorie pour le moment.
      </p>
    </div>
  </main>
</template>

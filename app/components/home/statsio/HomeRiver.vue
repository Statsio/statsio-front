<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { CatalogItem } from '@/types/catalog'
import { catalogThemeStyle } from '@/lib/catalog-theme'
import { formatCatalogViews, formatReadingTime, formatRelativePublished } from '@/lib/catalog-format'
import { publicContentPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import HomeSectionHeading from '@/components/home/statsio/HomeSectionHeading.vue'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'

defineProps<{
  title: string
  river: CatalogItem[]
  mostRead: CatalogItem[]
}>()

const base = useContentBasePath()

function pathOf(item: CatalogItem) {
  return publicContentPath('article', item.slug, base.value)
}
function themeOf(item: CatalogItem) {
  return catalogThemeStyle(item.category)
}
</script>

<template>
  <div class="grid gap-10 lg:grid-cols-[1fr_318px]">
    <div>
      <HomeSectionHeading
        eyebrow="EN CE MOMENT"
        :title="title"
        all-label="Tous les articles"
        :all-to="`${base}/articles`"
      />

      <div class="flex flex-col divide-y divide-slate-200/80">
        <article v-for="item in river" :key="item.id" class="u-hover flex gap-4 py-5 first:pt-0 sm:gap-5">
          <RouterLink
            :to="pathOf(item)"
            class="relative block h-[86px] w-[130px] shrink-0 overflow-hidden rounded-[12px] sm:h-[104px] sm:w-[164px]"
          >
            <AppMediaImage :src="item.thumbnail_url" :alt="item.title" class="u-card-media" mark-class="min-w-0 w-2/5" />
          </RouterLink>
          <div class="min-w-0">
            <span
              v-if="item.category"
              class="font-mono text-[9.5px] font-semibold tracking-[0.07em]"
              :style="{ color: themeOf(item).fg }"
            >
              {{ item.category.toUpperCase() }}
            </span>
            <RouterLink
              :to="pathOf(item)"
              class="u-card-title mt-1 block text-[16px] font-extrabold leading-[1.24] tracking-[-0.015em] text-slate-950 text-pretty hover:text-primary sm:text-[17.5px]"
            >
              {{ item.title }}
            </RouterLink>
            <p v-if="item.description" class="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-slate-500">
              {{ item.description }}
            </p>
            <span class="mt-2 block font-mono text-[10px] text-slate-400">
              {{ item.publisher.name }} · {{ formatReadingTime(item.reading_minutes) }} ·
              {{ formatRelativePublished(item.updated_at) }}
            </span>
          </div>
        </article>
      </div>
    </div>

    <aside class="flex flex-col gap-6 lg:sticky lg:top-32 lg:self-start">
      <div class="rounded-[18px] border-[1.5px] border-slate-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
        <span class="font-mono text-[10px] font-semibold tracking-[0.11em] text-accent">LES PLUS CONSULTÉS</span>
        <ol class="mt-4 flex flex-col divide-y divide-slate-100">
          <li v-for="(item, i) in mostRead" :key="item.id" class="u-hover group flex gap-3 py-3 first:pt-0 last:pb-0">
            <span
              class="font-mono text-[20px] font-extrabold leading-none text-slate-200 transition-colors duration-300 group-hover:text-primary/40"
            >
              {{ i + 1 }}
            </span>
            <div class="min-w-0">
              <RouterLink
                :to="pathOf(item)"
                class="u-card-title block text-[13px] font-bold leading-[1.3] text-slate-950 text-pretty hover:text-primary"
              >
                {{ item.title }}
              </RouterLink>
              <span class="mt-1 block font-mono text-[9.5px] text-slate-400">
                {{ formatCatalogViews(item.views_count) }}
              </span>
            </div>
          </li>
        </ol>
      </div>

      <div
        class="group rounded-[18px] bg-[linear-gradient(150deg,#18181f,#241f33)] p-5 text-white shadow-[0_1px_3px_rgba(20,20,30,0.06)] transition-shadow duration-300 hover:shadow-[0_22px_45px_-22px_rgba(124,58,237,0.55)]"
      >
        <span class="font-mono text-[10px] font-semibold tracking-[0.11em] text-[#c4b5fd]">NEWSLETTER</span>
        <p class="mt-3 text-[14.5px] font-bold leading-snug">
          L'essentiel des données publiques, une fois par semaine.
        </p>
        <p class="mt-1.5 text-[12px] leading-relaxed text-white/60">
          Les décryptages, statsdata et consultations à ne pas manquer.
        </p>
        <RouterLink
          to="/register"
          class="group/cta mt-4 inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] px-4 py-2.5 text-[12.5px] font-extrabold tracking-[0.02em] text-white transition hover:brightness-110"
        >
          Je m'abonne gratuitement
          <span class="transition-transform duration-300 ease-out group-hover/cta:translate-x-1">→</span>
        </RouterLink>
      </div>
    </aside>
  </div>
</template>

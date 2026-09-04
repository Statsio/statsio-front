<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { CatalogItem } from '@/types/catalog'
import { catalogThemeStyle } from '@/lib/catalog-theme'
import { formatReadingTime, formatRelativePublished } from '@/lib/catalog-format'
import { publicContentPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import ContentCardFavButton from '@/components/content/ContentCardFavButton.vue'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'

const props = defineProps<{
  lead: CatalogItem
  secondary: CatalogItem[]
  isFavorited: (item: CatalogItem) => boolean
}>()

const emit = defineEmits<{ favorite: [CatalogItem] }>()

const base = useContentBasePath()

function pathOf(item: CatalogItem) {
  return publicContentPath('article', item.slug, base.value)
}
function themeOf(item: CatalogItem) {
  return catalogThemeStyle(item.category)
}

const leadTheme = computed(() => themeOf(props.lead))
</script>

<template>
  <div class="grid gap-8" :class="secondary.length ? 'lg:grid-cols-[1.55fr_1fr]' : ''">
    <!-- Grande une -->
    <article
      class="u-hover flex flex-col"
      :class="secondary.length ? '' : 'mx-auto max-w-[820px]'"
    >
      <div
        class="relative overflow-hidden rounded-[20px] shadow-[0_1px_3px_rgba(20,20,30,0.06)] transition-shadow duration-300 hover:shadow-[0_22px_50px_-24px_rgba(20,20,30,0.4)]"
      >
        <RouterLink :to="pathOf(lead)" class="block">
          <div class="aspect-[16/9] w-full">
            <AppMediaImage :src="lead.thumbnail_url" :alt="lead.title" class="u-card-media" />
          </div>
        </RouterLink>
        <span
          v-if="lead.category"
          class="pointer-events-none absolute left-4 top-4 rounded-[6px] bg-white/95 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.08em] shadow-sm"
          :style="{ color: leadTheme.fg }"
        >
          {{ lead.category.toUpperCase() }}
        </span>
        <ContentCardFavButton
          class="absolute right-3 top-3"
          :active="isFavorited(lead)"
          @toggle="emit('favorite', lead)"
        />
      </div>

      <div class="mt-4">
        <RouterLink
          :to="pathOf(lead)"
          class="u-card-title block text-[24px] font-extrabold leading-[1.14] tracking-[-0.025em] text-slate-950 text-pretty hover:text-primary sm:text-[30px]"
        >
          {{ lead.title }}
        </RouterLink>
        <p v-if="lead.description" class="mt-3 max-w-[58ch] text-[15px] leading-relaxed text-slate-600">
          {{ lead.description }}
        </p>
        <div class="mt-4 flex items-center gap-2.5">
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[9px] border border-slate-200 bg-white text-[11px] font-extrabold text-slate-900"
          >
            <img
              v-if="lead.publisher.logo_url"
              :src="lead.publisher.logo_url"
              :alt="lead.publisher.name"
              class="h-full w-full object-cover"
            />
            <span v-else>{{ lead.publisher.initials }}</span>
          </span>
          <span class="flex items-center gap-1 text-[13px] font-bold text-slate-900">
            {{ lead.publisher.name }}
            <span v-if="lead.publisher.verified" class="text-[10px] text-accent">✔</span>
          </span>
          <span class="font-mono text-[11px] text-slate-400">
            · {{ formatReadingTime(lead.reading_minutes) }} · {{ formatRelativePublished(lead.updated_at) }}
          </span>
        </div>
      </div>
    </article>

    <!-- Colonne de contenus secondaires -->
    <div
      v-if="secondary.length"
      class="flex flex-col divide-y divide-slate-200/80 border-t border-slate-200/80 lg:border-t-0 lg:border-l lg:pl-8"
    >
      <article
        v-for="item in secondary"
        :key="item.id"
        class="u-hover flex gap-3.5 py-4 first:pt-0 lg:first:pt-0"
      >
        <RouterLink
          :to="pathOf(item)"
          class="relative block h-[64px] w-[92px] shrink-0 overflow-hidden rounded-[10px]"
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
            class="u-card-title mt-1 block text-[14px] font-bold leading-[1.28] tracking-[-0.01em] text-slate-950 text-pretty hover:text-primary"
          >
            {{ item.title }}
          </RouterLink>
          <span class="mt-1 block font-mono text-[10px] text-slate-400">
            {{ item.publisher.name }} · {{ formatReadingTime(item.reading_minutes) }}
          </span>
        </div>
      </article>
    </div>
  </div>
</template>

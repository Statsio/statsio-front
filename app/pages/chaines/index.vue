<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Chaînes éditoriales',
  description: "Explorez les chaînes Statsio : sources officielles, experts indépendants et collectifs thématiques sur la politique, l'économie, la société et plus.",
})

import { onMounted } from 'vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import ChannelDirectoryToolbar from '@/components/channels/ChannelDirectoryToolbar.vue'
import ChannelDirectoryGrid from '@/components/channels/ChannelDirectoryGrid.vue'
import { useChannelsDirectory } from '@/composables/useChannelsDirectory'

const {
  channels,
  categories,
  loading,
  error,
  search,
  category,
  sort,
  page,
  lastPage,
  total,
  setPage,
  resetFilters,
  init,
} = useChannelsDirectory()

onMounted(init)
</script>

<template>
  <main>
    <!--
      -mt-44 lg:-mt-28 cancels the layout's <main class="pt-44 lg:pt-28"> (app/layouts/default.vue)
      so the lilac wash bleeds all the way under the translucent fixed header, matching the
      "Chaînes — Annuaire" mockup's flat #eeecf5 page background. See PageHero.vue for the same pattern.
    -->
    <section class="relative -mt-44 min-h-screen bg-[var(--color-auth-wash)] pb-[100px] pt-44 lg:-mt-28 lg:pt-28">
      <div class="container flex flex-col gap-6 pt-6 lg:px-16">
        <ChannelDirectoryToolbar
          v-model:search="search"
          v-model:category="category"
          v-model:sort="sort"
          :categories="categories"
          :total="total"
          :loading="loading"
          @reset="resetFilters"
        />

        <ChannelDirectoryGrid
          :channels="channels"
          :loading="loading"
          :error="error"
          @retry="init"
          @reset="resetFilters"
        />

        <AppPagination
          v-if="!loading && !error"
          :current-page="page"
          :last-page="lastPage"
          @update:current-page="setPage"
        />
      </div>
    </section>
  </main>
</template>

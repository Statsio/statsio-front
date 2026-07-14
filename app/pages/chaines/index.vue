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
  <main class="pb-24">
    <section class="section pt-4">
      <div class="container flex flex-col gap-6">
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

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: ['auth'], ssr: false, title: 'Mes contenus', robots: 'noindex,nofollow' })
import ContenusHeader from '@/components/contenus/ContenusHeader.vue'
import ContenusLegend from '@/components/contenus/ContenusLegend.vue'
import ContenusFilters from '@/components/contenus/ContenusFilters.vue'
import ContentCard from '@/components/contenus/ContentCard.vue'
import ContenusEmptyState from '@/components/contenus/ContenusEmptyState.vue'
import { useMyStudioContents } from '@/composables/useMyStudioContents'

const { loading, filter, filterOptions, filteredContents, isEmpty, isFilteredEmpty } = useMyStudioContents()
</script>

<template>
  <main class="pb-24 pt-4">
    <section class="section pb-10">
      <div class="container flex flex-col gap-6">
        <ContenusHeader />

        <div v-if="loading" class="flex items-center justify-center py-32">
          <svg class="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>

        <template v-else>
          <ContenusLegend />
          <ContenusFilters v-model="filter" :options="filterOptions" />

          <div class="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
            <ContentCard v-for="content in filteredContents" :key="content.id" :content="content" />
          </div>

          <ContenusEmptyState v-if="isFilteredEmpty" :has-any-content="!isEmpty" />
        </template>
      </div>
    </section>
  </main>
</template>

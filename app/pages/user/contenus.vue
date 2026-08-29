<script setup lang="ts">
import AccountPageHeader from '@/components/user/AccountPageHeader.vue'
import ContenusLegend from '@/components/contenus/ContenusLegend.vue'
import ContenusFilters from '@/components/contenus/ContenusFilters.vue'
import ContentCard from '@/components/contenus/ContentCard.vue'
import ContenusEmptyState from '@/components/contenus/ContenusEmptyState.vue'
import { useMyStudioContents } from '@/composables/useMyStudioContents'

definePageMeta({ layout: 'account', middleware: ['auth'], ssr: false, title: 'Mes contenus', robots: 'noindex,nofollow' })

const { loading, filter, filterOptions, filteredContents, isEmpty, isFilteredEmpty } = useMyStudioContents()
</script>

<template>
  <div>
    <AccountPageHeader
      title="Mes contenus"
      subtitle="Tout ce que vous avez publié — en votre nom, ou au nom d'une chaîne à laquelle vous êtes affiliée."
    />

    <div v-if="loading" class="flex items-center justify-center py-32">
      <svg class="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <template v-else>
      <div class="mb-5 flex flex-col gap-3">
        <ContenusLegend />
        <ContenusFilters v-model="filter" :options="filterOptions" />
      </div>

      <div class="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        <ContentCard v-for="content in filteredContents" :key="content.id" :content="content" />
      </div>

      <ContenusEmptyState v-if="isFilteredEmpty" :has-any-content="!isEmpty" />
    </template>
  </div>
</template>

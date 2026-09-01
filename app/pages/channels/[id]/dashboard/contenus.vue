<script setup lang="ts">
definePageMeta({ layout: 'channel-dashboard', middleware: ['auth'], ssr: false, title: 'Contenus de la chaîne', robots: 'noindex,nofollow' })
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ContentCard from '@/components/content/ContentCard.vue'
import ContenusEmptyState from '@/components/contenus/ContenusEmptyState.vue'
import ChannelContentTypeFilter from '@/components/channels/ChannelContentTypeFilter.vue'
import ChannelDashboardHeader from '@/components/channels/dashboard/ChannelDashboardHeader.vue'
import { useChannelDashboard } from '@/composables/useChannelDashboard'
import { useChannelContents } from '@/composables/useChannelContents'

const route = useRoute()
const channelId = computed(() => Number(route.params.id))
const { channel } = useChannelDashboard()

const { loading, filter, filterOptions, filteredContents, isEmpty, isFilteredEmpty } = useChannelContents(
  channelId,
  channel,
)
</script>

<template>
  <div>
    <ChannelDashboardHeader
      title="Contenus"
      subtitle="Tout ce qui est publié au nom de cette chaîne."
    />

    <div class="mb-6">
      <ChannelContentTypeFilter v-model="filter" :options="filterOptions" />
    </div>

    <div v-if="loading" class="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="i in 3" :key="i" class="h-64 animate-pulse rounded-2xl bg-slate-100" />
    </div>

    <div v-else class="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
      <ContentCard
        v-for="entry in filteredContents"
        :key="entry.item.id"
        :item="entry.item"
        :manage="entry.manage"
        mode="manage"
        hide-owner
      />
    </div>

    <ContenusEmptyState v-if="!loading && isFilteredEmpty" :has-any-content="!isEmpty" />
  </div>
</template>

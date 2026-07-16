<script setup lang="ts">
definePageMeta({ layout: 'channel-dashboard', middleware: ['auth'], ssr: false, title: 'Contenus de la chaîne', robots: 'noindex,nofollow' })
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ContenusCreateButton from '@/components/contenus/ContenusCreateButton.vue'
import ContentCard from '@/components/contenus/ContentCard.vue'
import ContenusEmptyState from '@/components/contenus/ContenusEmptyState.vue'
import ChannelContentTypeFilter from '@/components/channels/ChannelContentTypeFilter.vue'
import { useChannelDashboard } from '@/composables/useChannelDashboard'
import { useChannelContents } from '@/composables/useChannelContents'

const route = useRoute()
const channelId = computed(() => Number(route.params.id))
const { channel, isLoading, loadError } = useChannelDashboard()

onMounted(() => useChannelDashboard().ensureLoaded(channelId.value))

const { loading, filter, filterOptions, filteredContents, isEmpty, isFilteredEmpty } = useChannelContents(channelId, channel)
</script>

<template>
  <div>

    <template v-if="isLoading">
      <div class="h-10 w-64 animate-pulse rounded-2xl bg-slate-200" />
    </template>

    <p v-else-if="loadError" class="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
      {{ loadError }}
    </p>

    <template v-else-if="channel">
      <div class="mb-2 flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 class="mb-1.5 text-[26px] font-bold text-slate-950">Contenus de {{ channel.profile.name }}</h1>
          <p class="max-w-[520px] text-[14.5px] text-slate-500">Tout ce qui est publié au nom de cette chaîne.</p>
        </div>
        <ContenusCreateButton />
      </div>

      <div class="my-6">
        <ChannelContentTypeFilter v-model="filter" :options="filterOptions" />
      </div>

      <div v-if="loading" class="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 3" :key="i" class="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>

      <div v-else class="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
        <ContentCard v-for="content in filteredContents" :key="content.id" :content="content" />
      </div>

      <ContenusEmptyState v-if="!loading && isFilteredEmpty" :has-any-content="!isEmpty" />
    </template>

  </div>
</template>

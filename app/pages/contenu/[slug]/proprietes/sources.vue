<script setup lang="ts">
definePageMeta({
  layout: 'content-dashboard',
  middleware: ['auth'],
  ssr: false,
  title: 'Sources de données',
  robots: 'noindex,nofollow',
})

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ContentDashboardHeader from '@/components/contents/dashboard/ContentDashboardHeader.vue'
import ChannelDataSourceRow from '@/components/channels/dashboard/ChannelDataSourceRow.vue'
import { useContentDashboard } from '@/composables/useContentDashboard'
import { useContentDataSources } from '@/composables/useContentDataSources'

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { studioPath } = useContentDashboard()
const { sources, loading, error } = useContentDataSources(slug)
</script>

<template>
  <div>
    <ContentDashboardHeader
      title="Sources de données"
      subtitle="Les jeux de données qui alimentent ce contenu et leur fraîcheur."
    />

    <p
      v-if="error"
      class="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      {{ error }}
    </p>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-16 animate-pulse rounded-2xl bg-slate-100" />
    </div>

    <template v-else>
      <div
        v-if="sources.length"
        class="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(20,20,30,0.05)]"
      >
        <div class="flex items-baseline justify-between gap-3 px-6 pb-3 pt-5">
          <p class="text-sm font-bold text-slate-950">Sources rattachées</p>
          <span class="font-mono text-[11px] text-slate-400">
            {{ sources.length }} {{ sources.length > 1 ? 'sources' : 'source' }}
          </span>
        </div>
        <ChannelDataSourceRow v-for="source in sources" :key="source.id" :source="source" />
      </div>

      <p
        v-else
        class="mb-4 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-400"
      >
        Aucun jeu de données n'est encore utilisé par les blocs de ce contenu.
      </p>

      <NuxtLink
        :to="studioPath"
        class="flex items-center gap-4 rounded-2xl border-[1.5px] border-dashed border-slate-200 px-5 py-4 transition hover:bg-white"
      >
        <span
          class="flex h-9 w-11 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-dashed border-slate-300 text-[15px] text-primary"
        >
          +
        </span>
        <span>
          <span class="block text-[13.5px] font-bold text-slate-950">Rattacher une source</span>
          <span class="mt-0.5 block text-[11.5px] text-slate-500">
            CSV, API REST, Google Sheets ou base SQL — la connexion se fait dans le Studio.
          </span>
        </span>
      </NuxtLink>
    </template>
  </div>
</template>

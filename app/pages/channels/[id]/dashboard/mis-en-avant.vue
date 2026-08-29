<script setup lang="ts">
definePageMeta({ layout: 'channel-dashboard', middleware: ['auth'], ssr: false, title: 'Mis en avant', robots: 'noindex,nofollow' })
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchUserStudioContents, type StatsDataDocument } from '@/api/studio'
import ChannelDashboardHeader from '@/components/channels/dashboard/ChannelDashboardHeader.vue'
import ChannelFeaturedContentSlot from '@/components/channels/ChannelFeaturedContentSlot.vue'
import { useChannelDashboard } from '@/composables/useChannelDashboard'
import { useChannelFeaturedContent } from '@/composables/useChannelFeaturedContent'

const route = useRoute()
const channelId = computed(() => Number(route.params.id))
const { channel } = useChannelDashboard()

const { featured, saving, error, setSlot } = useChannelFeaturedContent(channelId)

const contents = ref<StatsDataDocument[]>([])
const contentsLoading = ref(true)

onMounted(async () => {
  contentsLoading.value = true
  try {
    contents.value = await fetchUserStudioContents(undefined, channelId.value)
  } finally {
    contentsLoading.value = false
  }
})

function publishedOfType(type: string) {
  return contents.value.filter((c) => c.type === type && c.status === 'published')
}

const articleCandidates = computed(() => publishedOfType('article'))
const statsdataCandidates = computed(() => publishedOfType('statsdata'))
const surveyCandidates = computed(() => publishedOfType('survey'))
</script>

<template>
  <div>
    <ChannelDashboardHeader
      title="Mis en avant"
      :subtitle="`Le contenu affiché dans l'onglet « À la une » de la page publique de ${channel?.profile?.name ?? 'la chaîne'} — un article, une StatsData et un sondage.`"
    />

    <p v-if="error" class="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ error }}
    </p>

    <div v-if="contentsLoading" class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div v-for="i in 3" :key="i" class="h-40 animate-pulse rounded-2xl bg-slate-100" />
    </div>

    <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ChannelFeaturedContentSlot
        label="Article"
        :selected="featured?.article ?? null"
        :candidates="articleCandidates"
        :saving="saving.article"
        @select="(id) => setSlot('article', id)"
        @clear="setSlot('article', null)"
      />
      <ChannelFeaturedContentSlot
        label="StatsData"
        :selected="featured?.statsdata ?? null"
        :candidates="statsdataCandidates"
        :saving="saving.statsdata"
        @select="(id) => setSlot('statsdata', id)"
        @clear="setSlot('statsdata', null)"
      />
      <ChannelFeaturedContentSlot
        label="Sondage"
        :selected="featured?.survey ?? null"
        :candidates="surveyCandidates"
        :saving="saving.survey"
        @select="(id) => setSlot('survey', id)"
        @clear="setSlot('survey', null)"
      />
    </div>
  </div>
</template>

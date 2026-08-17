<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Chaînes éditoriales',
  description: "Explorez les chaînes Statsio : sources officielles, experts indépendants et collectifs thématiques sur la politique, l'économie, la société et plus.",
})

import { computed, onMounted, ref } from 'vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import ChannelDirectoryToolbar from '@/components/channels/ChannelDirectoryToolbar.vue'
import ChannelDirectoryGrid from '@/components/channels/ChannelDirectoryGrid.vue'
import { useChannelsDirectory } from '@/composables/useChannelsDirectory'
import { useMyChannels } from '@/composables/useMyChannels'
import { useAuthStore } from '@/stores/auth'

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

const auth = useAuthStore()
const { channels: myChannels, fetch: fetchMyChannels } = useMyChannels()
const ownedIds = computed(() => new Set(myChannels.value.map((c) => c.id)))

const view = ref<'grid' | 'list'>('grid')
const verifiedOnly = ref(false)
const followedOnly = ref(false)

// Le tri/la pagination viennent de l'API ; "vérifiées" et "mes abonnements" n'ont pas
// d'équivalent côté serveur, donc on les applique côté client sur la page chargée.
const filteredChannels = computed(() => {
  let list = channels.value
  if (verifiedOnly.value) list = list.filter((c) => c.badges.includes('verified'))
  if (followedOnly.value) list = list.filter((c) => c.profile?.is_following || ownedIds.value.has(c.id))
  return list
})

function handleReset() {
  verifiedOnly.value = false
  followedOnly.value = false
  resetFilters()
}

onMounted(() => {
  init()
  if (auth.isAuthenticated) fetchMyChannels()
})
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
          v-model:view="view"
          v-model:verified-only="verifiedOnly"
          v-model:followed-only="followedOnly"
          :categories="categories"
          :total="total"
          :result-count="filteredChannels.length"
          :loading="loading"
          @reset="handleReset"
        />

        <ChannelDirectoryGrid
          :channels="filteredChannels"
          :view="view"
          :loading="loading"
          :error="error"
          :owned-ids="ownedIds"
          @retry="init"
          @reset="handleReset"
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

<script setup lang="ts">
definePageMeta({ layout: 'default' })
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { channelCategoryLabels, type ChannelCategory } from '@/api/channels'
import type { ChannelEntry } from '@/data/channels'
import { fetchChannelByHandle } from '@/lib/channels-api'
import { useAuthStore } from '@/stores/auth'
import { AUTH_REDIRECT_KEY } from '@/lib/auth-storage'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const channel = ref<ChannelEntry | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const isFollowing = ref(false)

usePageSeo({
  title: computed(() => channel.value?.name),
  description: computed(() => channel.value?.description),
})

onMounted(async () => {
  try {
    const handle = String(route.params.handle ?? '')
    const currentChannel = await fetchChannelByHandle(handle)

    if (currentChannel) {
      channel.value = currentChannel
    } else {
      error.value = 'Chaîne non trouvée'
    }
  } catch (e) {
    error.value = 'Erreur lors du chargement de la chaîne'
    console.error(e)
  } finally {
    loading.value = false
  }
})

function toggleFollow() {
  if (!auth.isAuthenticated) {
    try {
      sessionStorage.setItem(AUTH_REDIRECT_KEY, route.fullPath)
      localStorage.setItem(AUTH_REDIRECT_KEY, route.fullPath)
    } catch {
      /* stockage indisponible */
    }
    router.push('/login')
    return
  }
  isFollowing.value = !isFollowing.value
}

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

const formatLongDate = (iso?: string) => {
  if (!iso) return null
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
}

const categoryLabels = computed(() =>
  (channel.value?.themes ?? []).map((slug: string) => channelCategoryLabels[slug as ChannelCategory] ?? slug),
)

type TabKey = 'accueil' | 'articles' | 'statsdata' | 'sondages' | 'apropos'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'accueil', label: 'Accueil' },
  { key: 'articles', label: 'Articles' },
  { key: 'statsdata', label: 'StatsData' },
  { key: 'sondages', label: 'Sondages' },
  { key: 'apropos', label: 'À propos' },
]

const activeTab = ref<TabKey>('accueil')

type FeedItem = { type: 'article' | 'statsdata' | 'poll'; title: string }

const feedTypeLabels: Record<FeedItem['type'], string> = {
  article: 'Article',
  statsdata: 'StatsData',
  poll: 'Sondage',
}

const feedTypeClasses: Record<FeedItem['type'], string> = {
  article: 'bg-primary/10 text-primary',
  statsdata: 'bg-accent/15 text-slate-900',
  poll: 'bg-slate-100 text-slate-700',
}

const allFeedItems = computed<FeedItem[]>(() => {
  if (!channel.value) return []
  return [
    ...channel.value.articles.map((title: string) => ({ type: 'article' as const, title })),
    ...channel.value.statsData.map((title: string) => ({ type: 'statsdata' as const, title })),
    ...channel.value.polls.map((title: string) => ({ type: 'poll' as const, title })),
  ]
})

const pinnedItem = computed(() => allFeedItems.value[0] ?? null)
const recentItems = computed(() => allFeedItems.value.slice(1))

// Score déterministe (non basé sur de vraies métriques d'engagement, l'API ne les expose pas encore)
// utilisé uniquement pour démontrer les tris de l'onglet Sondages.
function hashString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

type SondageSort = 'recent' | 'populaire' | 'note'

const sondageSort = ref<SondageSort>('recent')

const sondageSortOptions: { key: SondageSort; label: string }[] = [
  { key: 'recent', label: 'Récents' },
  { key: 'populaire', label: 'Populaires' },
  { key: 'note', label: 'Mieux notés' },
]

const pollItems = computed(() =>
  (channel.value?.polls ?? []).map((title: string, index: number) => {
    const hash = hashString(title)
    return {
      title,
      index,
      participants: 180 + (hash % 4200),
      rating: (30 + (hash % 20)) / 10,
    }
  }),
)

const sortedPollItems = computed(() => {
  const items = [...pollItems.value]
  if (sondageSort.value === 'populaire') {
    return items.sort((a, b) => b.participants - a.participants)
  }
  if (sondageSort.value === 'note') {
    return items.sort((a, b) => b.rating - a.rating)
  }
  return items.sort((a, b) => a.index - b.index)
})
</script>

<template>
  <main class="pb-24 pt-4">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-32">
      <p class="text-slate-500">Chargement de la chaîne...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-32">
      <p class="text-lg font-semibold text-red-600">{{ error }}</p>
      <AppButton as="router-link" to="/chaines" variant="secondary" size="md" class="mt-4">
        Retour au catalogue
      </AppButton>
    </div>

    <template v-else-if="channel">
      <!-- Bannière -->
      <div class="relative h-40 w-full overflow-hidden bg-slate-950 sm:h-64">
        <img v-if="channel.bannerUrl" :src="channel.bannerUrl" alt="" class="h-full w-full object-cover" />
        <div v-else class="h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />
      </div>

      <section class="section pt-0">
        <div class="container">
          <!-- En-tête chaîne -->
          <div class="flex flex-col gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div class="-mt-12 flex flex-col items-start gap-4 sm:-mt-14 sm:flex-row sm:items-end">
              <div
                class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border-4 border-white bg-slate-950 text-2xl font-semibold text-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.6)] sm:h-28 sm:w-28"
                :class="channel.isOfficial ? 'rounded-[1.75rem]' : 'rounded-full'"
              >
                <img v-if="channel.logoUrl" :src="channel.logoUrl" alt="" class="h-full w-full object-cover" />
                <span v-else>{{ channel.initials }}</span>
              </div>

              <div class="min-w-0 pb-1">
                <h1 class="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                  {{ channel.name }}
                </h1>
                <p class="mt-1 text-sm font-medium text-slate-400">{{ channel.handle }}</p>
                <div v-if="categoryLabels.length" class="mt-3 flex flex-wrap gap-2">
                  <span
                    v-for="label in categoryLabels"
                    :key="label"
                    class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600"
                  >
                    {{ label }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-3 pb-1">
              <p class="text-sm text-slate-500">
                <span class="font-semibold text-slate-950">{{ formatCompactNumber(channel.followers) }}</span> suivis
              </p>
              <AppButton :variant="isFollowing ? 'secondary' : 'primary'" size="md" @click="toggleFollow">
                {{ isFollowing ? 'Suivi' : 'Suivre' }}
              </AppButton>
            </div>
          </div>

          <!-- Tabs -->
          <div class="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              class="shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition"
              :class="
                activeTab === tab.key
                  ? 'border-primary text-slate-950'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              "
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Onglet Accueil -->
          <div v-if="activeTab === 'accueil'" class="flex flex-col gap-8 py-8">
            <div v-if="pinnedItem" class="flex flex-col gap-3">
              <p class="eyebrow text-primary">Épinglé par la chaîne</p>
              <article class="rounded-[1.5rem] border border-primary/20 bg-primary/5 p-6">
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                  :class="feedTypeClasses[pinnedItem.type]"
                >
                  {{ feedTypeLabels[pinnedItem.type] }}
                </span>
                <p class="mt-4 text-lg font-semibold leading-7 text-slate-950">{{ pinnedItem.title }}</p>
              </article>
            </div>

            <div class="flex flex-col gap-3">
              <p class="eyebrow">Contenus récents</p>
              <div v-if="recentItems.length" class="grid gap-4 sm:grid-cols-2">
                <article
                  v-for="(item, i) in recentItems"
                  :key="i"
                  class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.35)]"
                >
                  <span
                    class="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                    :class="feedTypeClasses[item.type]"
                  >
                    {{ feedTypeLabels[item.type] }}
                  </span>
                  <p class="mt-3 text-base font-semibold leading-7 text-slate-950">{{ item.title }}</p>
                </article>
              </div>
              <p v-else class="text-sm text-slate-500">Aucun contenu récent pour le moment.</p>
            </div>

            <p v-if="!pinnedItem && !recentItems.length" class="text-sm text-slate-500">
              Cette chaîne n'a pas encore publié de contenu.
            </p>
          </div>

          <!-- Onglet Articles -->
          <div v-else-if="activeTab === 'articles'" class="py-8">
            <div v-if="channel.articles.length" class="grid gap-4 sm:grid-cols-2">
              <article
                v-for="item in channel.articles"
                :key="item"
                class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.35)]"
              >
                <p class="text-base font-semibold leading-7 text-slate-950">{{ item }}</p>
              </article>
            </div>
            <p v-else class="text-sm text-slate-500">Aucun article publié pour le moment.</p>
          </div>

          <!-- Onglet StatsData -->
          <div v-else-if="activeTab === 'statsdata'" class="py-8">
            <div v-if="channel.statsData.length" class="grid gap-4 sm:grid-cols-2">
              <article
                v-for="item in channel.statsData"
                :key="item"
                class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.35)]"
              >
                <p class="text-base font-semibold leading-7 text-slate-950">{{ item }}</p>
              </article>
            </div>
            <p v-else class="text-sm text-slate-500">Aucune StatsData publiée pour le moment.</p>
          </div>

          <!-- Onglet Sondages -->
          <div v-else-if="activeTab === 'sondages'" class="flex flex-col gap-5 py-8">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="option in sondageSortOptions"
                :key="option.key"
                type="button"
                class="rounded-full border px-4 py-2 text-sm font-semibold transition"
                :class="
                  sondageSort === option.key
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                "
                @click="sondageSort = option.key"
              >
                {{ option.label }}
              </button>
            </div>

            <div v-if="sortedPollItems.length" class="grid gap-4 sm:grid-cols-2">
              <article
                v-for="item in sortedPollItems"
                :key="item.title"
                class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.35)]"
              >
                <p class="text-base font-semibold leading-7 text-slate-950">{{ item.title }}</p>
                <div class="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span>{{ formatCompactNumber(item.participants) }} participations</span>
                  <span>{{ item.rating.toFixed(1) }} / 5</span>
                </div>
              </article>
            </div>
            <p v-else class="text-sm text-slate-500">Aucun sondage publié pour le moment.</p>
          </div>

          <!-- Onglet À propos -->
          <div v-else-if="activeTab === 'apropos'" class="grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div class="flex flex-col gap-4">
              <p class="eyebrow">Description</p>
              <p class="text-base leading-8 text-slate-600">
                {{ channel.longDescription || 'Aucune description renseignée pour cette chaîne.' }}
              </p>

              <div v-if="categoryLabels.length" class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="label in categoryLabels"
                  :key="label"
                  class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600"
                >
                  {{ label }}
                </span>
              </div>
            </div>

            <div class="flex flex-col gap-4">
              <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Informations</p>
                <dl class="mt-4 flex flex-col gap-3 text-sm">
                  <div class="flex items-center justify-between gap-4">
                    <dt class="text-slate-500">Nom</dt>
                    <dd class="font-semibold text-slate-950">{{ channel.name }}</dd>
                  </div>
                  <div class="flex items-center justify-between gap-4">
                    <dt class="text-slate-500">Identifiant</dt>
                    <dd class="font-semibold text-slate-950">{{ channel.handle }}</dd>
                  </div>
                  <div v-if="formatLongDate(channel.createdAt)" class="flex items-center justify-between gap-4">
                    <dt class="text-slate-500">Créée le</dt>
                    <dd class="font-semibold text-slate-950">{{ formatLongDate(channel.createdAt) }}</dd>
                  </div>
                  <div v-if="channel.country" class="flex items-center justify-between gap-4">
                    <dt class="text-slate-500">Pays</dt>
                    <dd class="font-semibold text-slate-950">{{ channel.country }}</dd>
                  </div>
                  <div v-if="channel.ageRestriction" class="flex items-center justify-between gap-4">
                    <dt class="text-slate-500">Restriction d'âge</dt>
                    <dd class="font-semibold text-slate-950">{{ channel.ageRestriction }}+</dd>
                  </div>
                </dl>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-[1.5rem] bg-slate-950 px-4 py-4 text-white">
                  <p class="text-[11px] uppercase tracking-[0.16em] text-slate-400">Suivis</p>
                  <p class="mt-2 text-xl font-semibold">{{ formatCompactNumber(channel.followers) }}</p>
                </div>
                <div class="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
                  <p class="text-[11px] uppercase tracking-[0.16em] text-slate-400">Vues</p>
                  <p class="mt-2 text-xl font-semibold text-slate-950">{{ formatCompactNumber(channel.viewCount ?? 0) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>

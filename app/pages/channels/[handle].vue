<script setup lang="ts">
definePageMeta({ layout: 'default' })
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { channelToneClasses, type ChannelEntry } from '@/data/channels'
import { fetchChannelByHandle, fetchAllChannels } from '@/lib/channels-api'

const route = useRoute()

const channel = ref<ChannelEntry | null>(null)
const otherChannels = ref<ChannelEntry[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

usePageSeo({
  title: computed(() => channel.value?.name),
  description: computed(() => channel.value?.description),
})

onMounted(async () => {
  try {
    const handle = String(route.params.handle ?? '')
    const [currentChannel, allChannels] = await Promise.all([
      fetchChannelByHandle(handle),
      fetchAllChannels(),
    ])

    if (currentChannel) {
      channel.value = currentChannel
      otherChannels.value = allChannels.filter((c) => c.slug !== currentChannel.slug)
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

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
</script>

<template>
  <main class="pb-24 pt-4">
    <section class="section pb-10">
      <div class="container grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <!-- Loading state -->
        <div v-if="loading" class="flex items-center justify-center py-20">
          <p class="text-slate-500">Chargement de la chaîne...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="flex flex-col items-center justify-center py-20">
          <p class="text-lg font-semibold text-red-600">{{ error }}</p>
          <AppButton as="router-link" to="/chaines" variant="secondary" size="md" class="mt-4">
            Retour au catalogue
          </AppButton>
        </div>

        <!-- Channel content -->
        <div v-else-if="channel" class="flex flex-col">
          <!-- Bannière de la chaîne -->
          <div v-if="channel.bannerUrl" class="relative h-48 w-full overflow-hidden rounded-t-[2.5rem] bg-slate-100 sm:h-64">
            <img :src="channel.bannerUrl" alt="Bannière" class="h-full w-full object-cover" />
          </div>
          <div class="flex flex-col gap-6 rounded-[2.5rem] border border-slate-200 bg-white p-7 shadow-[0_30px_90px_-58px_rgba(15,23,42,0.35)] sm:p-9" :class="channel.bannerUrl ? 'rounded-t-none' : ''">
            <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div class="flex min-w-0 items-start gap-5">
               <div
                 class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden bg-slate-950 text-2xl font-semibold text-white"
                 :class="channel.isOfficial ? 'rounded-[1.5rem]' : 'rounded-full'"
               >
                 <img
                   v-if="channel.logoUrl"
                   :src="channel.logoUrl"
                   alt=""
                   class="h-full w-full object-cover"
                 />
                 <span v-else>{{ channel.initials }}</span>
               </div>

              <div class="min-w-0">
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                  :class="channelToneClasses[channel.tone]"
                >
                  {{ channel.isOfficial ? 'Statsio' : 'Chaîne éditoriale' }}
                </span>
                <h1 class="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
                  {{ channel.name }}
                </h1>
                <p class="mt-2 text-base font-medium text-slate-400">{{ channel.handle }}</p>
                <p class="mt-4 max-w-4xl text-base leading-8 text-slate-600">
                  {{ channel.longDescription }}
                </p>
              </div>
            </div>

            <div class="flex shrink-0 flex-wrap gap-3">
              <AppButton variant="primary" size="md">
                Suivre
              </AppButton>
              <AppButton v-if="channel.hasPaidSubscription" variant="outline" size="md">
                S’abonner<span v-if="channel.subscriptionPrice"> · {{ channel.subscriptionPrice }}</span>
              </AppButton>
            </div>
          </div>

          <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4">
            <p class="text-sm font-semibold text-slate-950">Suivre permet d'être alerté à chaque nouveau contenu et d'accéder aux contenus gratuits.</p>
            <p class="mt-1 text-sm leading-6 text-slate-500">
              <span v-if="channel.hasPaidSubscription">
                L'abonnement payant débloque les contenus réservés
                <span v-if="channel.subscriptionPrice">pour {{ channel.subscriptionPrice }}</span>.
              </span>
              <span v-else>Cette chaîne fonctionne uniquement en suivi et en accès gratuit.</span>
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <span
              v-for="theme in channel.themes"
              :key="theme"
              class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600"
            >
              {{ theme }}
            </span>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-[1.5rem] bg-slate-950 px-5 py-5 text-white">
              <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Abonnements payants</p>
              <p class="mt-3 text-2xl font-semibold">{{ formatCompactNumber(channel.subscriptions) }}</p>
            </div>
            <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5">
              <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Suivis</p>
              <p class="mt-3 text-2xl font-semibold text-slate-950">{{ formatCompactNumber(channel.followers) }}</p>
            </div>
          </div>
        </div>
        </div>

        <aside v-if="channel" class="flex flex-col gap-5 lg:sticky lg:top-36 lg:self-start">
          <div class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Positionnement</p>
            <p class="mt-4 text-sm leading-7 text-slate-300">
              Cette page front présente la chaîne {{ channel.name }} avec ses contenus récents et ses indicateurs clés.
            </p>
          </div>

          <div class="rounded-[2rem] border border-slate-200 bg-white p-6">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Navigation</p>
            <div class="mt-4 flex flex-col gap-3">
              <AppButton as="router-link" to="/fil-actus" variant="secondary" size="md">
                Voir le fil d'actus
              </AppButton>
              <AppButton as="router-link" to="/articles" variant="outline" size="md">
                Explorer les articles
              </AppButton>
            </div>
          </div>

          <div class="rounded-[2rem] border border-slate-200 bg-white p-6">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Autres chaînes</p>
            <div class="mt-4 flex flex-col gap-4">
              <article
                v-for="other in otherChannels"
                :key="other.slug"
                class="flex items-start gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 transition hover:border-primary/20"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-slate-950 text-sm font-semibold text-white"
                  :class="other.isOfficial ? 'rounded-[1rem]' : 'rounded-full'"
                >
                  {{ other.initials }}
                </div>
                <div class="min-w-0">
                  <h3 class="text-sm font-semibold leading-6 text-slate-950">{{ other.name }}</h3>
                  <p class="mt-0.5 truncate text-xs text-slate-500">{{ other.handle }}</p>
                  <p class="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{{ other.description }}</p>
                  <AppButton
                    as="router-link"
                    :to="'/channels/' + other.handle"
                    variant="secondary"
                    size="sm"
                    class="mt-2"
                  >
                    Voir la chaîne
                  </AppButton>
                </div>
              </article>
            </div>
          </div>
        </aside>
      </div>
    </section>
    <section v-if="channel" class="-mt-12">
      <div class="container">
        <div class="flex flex-col gap-6">
          <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Dernières actus</p>
            <div v-if="channel.articles.length" class="mt-5 grid gap-4">
              <article v-for="item in channel.articles" :key="item" class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p class="text-base font-semibold leading-7 text-slate-950">{{ item }}</p>
              </article>
            </div>
            <div v-else class="mt-5 text-sm text-slate-500">
              Aucune actualité disponible.
            </div>
          </div>

          <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Dernières StatsData</p>
            <div v-if="channel.statsData.length" class="mt-5 grid gap-4">
              <article v-for="item in channel.statsData" :key="item" class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p class="text-base font-semibold leading-7 text-slate-950">{{ item }}</p>
              </article>
            </div>
            <div v-else class="mt-5 text-sm text-slate-500">
              Aucune StatsData disponible.
            </div>
          </div>

          <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Derniers sondages</p>
            <div v-if="channel.polls.length" class="mt-5 grid gap-4">
              <article v-for="item in channel.polls" :key="item" class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p class="text-base font-semibold leading-7 text-slate-950">{{ item }}</p>
              </article>
            </div>
            <div v-else class="mt-5 text-sm text-slate-500">
              Aucun sondage disponible.
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>


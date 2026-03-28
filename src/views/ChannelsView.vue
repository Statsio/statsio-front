<script setup lang="ts">
import { computed, ref } from 'vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppPromoBanner from '@/components/layout/AppPromoBanner.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { channelThemeFilters, channels, channelToneClasses } from '@/data/channels'
import { sharedPromoItems } from '@/data/promo-items'

const searchQuery = ref('')
const activeFilter = ref<(typeof channelThemeFilters)[number]>('Tous')
const activeSort = ref<'popular' | 'subscriptions' | 'name'>('popular')

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

const filteredChannels = computed(() => {
  const normalizedQuery = searchQuery.value.trim().toLowerCase()

  const filtered = channels.filter((channel) => {
    const matchesFilter =
      activeFilter.value === 'Tous' || channel.themes.some((theme) => theme === activeFilter.value)

    const haystack = [
      channel.name,
      channel.handle,
      channel.description,
      ...channel.themes,
      ...channel.articles,
      ...channel.statsData,
      ...channel.polls,
    ]
      .join(' ')
      .toLowerCase()

    const matchesQuery = normalizedQuery.length === 0 || haystack.includes(normalizedQuery)

    return matchesFilter && matchesQuery
  })

  return filtered.sort((left, right) => {
    if (activeSort.value === 'name') {
      return left.name.localeCompare(right.name, 'fr')
    }

    if (activeSort.value === 'subscriptions') {
      return right.subscriptions - left.subscriptions
    }

    return right.followers - left.followers
  })
})
</script>

<template>
  <div class="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_18%,#eef4ff_100%)] text-slate-900">
    <AppPromoBanner :items="sharedPromoItems" />
    <AppHeader />

    <main class="pb-24 pt-28">
      <section class="section pt-4">
        <div class="container flex flex-col gap-6">
          <div class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)] sm:p-6">
            <div class="mb-5 flex flex-col gap-3">
              <p class="eyebrow text-primary">Chaînes & abonnements</p>
              <div class="max-w-3xl">
                <h1 class="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                  Recherchez et filtrez vos chaînes directement.
                </h1>
              </div>
            </div>

            <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
              <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <label class="flex flex-col gap-2">
                  <span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Recherche</span>
                  <input
                    v-model="searchQuery"
                    type="search"
                    placeholder="Chercher une chaîne, un thème ou un contenu"
                    class="min-h-12 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"
                  />
                </label>

                <label class="flex flex-col gap-2">
                  <span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tri</span>
                  <select
                    v-model="activeSort"
                    class="min-h-12 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"
                  >
                    <option value="popular">Les plus suivies</option>
                    <option value="subscriptions">Le plus d’abonnements payants</option>
                    <option value="name">Ordre alphabétique</option>
                  </select>
                </label>
              </div>

              <div class="flex items-center justify-between gap-4 xl:justify-end">
                <p class="text-sm text-slate-500">
                  {{ filteredChannels.length }} chaîne<span v-if="filteredChannels.length > 1">s</span>
                </p>
                <AppButton variant="secondary" size="md" @click="searchQuery = ''; activeFilter = 'Tous'; activeSort = 'popular'">
                  Réinitialiser
                </AppButton>
              </div>
            </div>

            <div class="mt-5 flex flex-wrap gap-2">
              <button
                v-for="filter in channelThemeFilters"
                :key="filter"
                type="button"
                class="rounded-full border px-4 py-2 text-sm font-semibold transition"
                :class="
                  activeFilter === filter
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                "
                @click="activeFilter = filter"
              >
                {{ filter }}
              </button>
            </div>
          </div>

          <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="channel in filteredChannels"
              :key="channel.slug"
              class="flex h-full flex-col rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)] transition hover:-translate-y-1 hover:border-primary/20"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex min-w-0 items-start gap-4">
                  <div
                    class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden bg-slate-950 font-semibold text-white"
                    :class="channel.isOfficial ? 'rounded-[1.25rem]' : 'rounded-full'"
                  >
                    {{ channel.initials }}
                  </div>

                  <div class="min-w-0">
                    <span
                      class="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                      :class="channelToneClasses[channel.tone]"
                    >
                      {{ channel.isOfficial ? 'Statsio' : 'Chaîne' }}
                    </span>
                    <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{{ channel.name }}</h2>
                    <p class="mt-1 truncate text-sm font-medium text-slate-400">{{ channel.handle }}</p>
                  </div>
                </div>

                <div class="flex shrink-0 flex-wrap justify-end gap-2">
                  <AppButton variant="primary" size="sm">
                    Suivre
                  </AppButton>
                  <AppButton v-if="channel.hasPaidSubscription" variant="outline" size="sm">
                    S’abonner
                  </AppButton>
                </div>
              </div>

              <p class="mt-4 text-sm leading-7 text-slate-600">
                {{ channel.description }}
              </p>

              <div class="mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <p class="text-sm font-semibold text-slate-900">Suivre = alertes + contenus gratuits</p>
                <p class="mt-1 text-sm leading-6 text-slate-500">
                  <span v-if="channel.hasPaidSubscription">
                    Abonnement payant disponible
                    <span v-if="channel.subscriptionPrice">({{ channel.subscriptionPrice }})</span>
                    pour les contenus réservés.
                  </span>
                  <span v-else>Cette chaîne ne propose pas d’abonnement payant actuellement.</span>
                </p>
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                <span
                  v-for="theme in channel.themes.slice(0, 3)"
                  :key="theme"
                  class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600"
                >
                  {{ theme }}
                </span>
              </div>

              <div class="mt-5 grid grid-cols-2 gap-3">
                <div class="rounded-[1.25rem] bg-slate-950 px-4 py-4 text-white">
                  <p class="text-[11px] uppercase tracking-[0.16em] text-slate-400">Abonnements payants</p>
                  <p class="mt-2 text-xl font-semibold">{{ formatCompactNumber(channel.subscriptions) }}</p>
                </div>
                <div class="rounded-[1.25rem] bg-slate-50 px-4 py-4">
                  <p class="text-[11px] uppercase tracking-[0.16em] text-slate-400">Suivis</p>
                  <p class="mt-2 text-xl font-semibold text-slate-950">{{ formatCompactNumber(channel.followers) }}</p>
                </div>
              </div>

              <div class="mt-5 grid grid-cols-3 gap-3">
                <div class="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-3 py-3">
                  <p class="text-[11px] uppercase tracking-[0.16em] text-slate-400">Actus</p>
                  <p class="mt-2 text-lg font-semibold text-slate-950">{{ channel.articles.length }}</p>
                </div>
                <div class="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-3 py-3">
                  <p class="text-[11px] uppercase tracking-[0.16em] text-slate-400">StatsData</p>
                  <p class="mt-2 text-lg font-semibold text-slate-950">{{ channel.statsData.length }}</p>
                </div>
                <div class="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-3 py-3">
                  <p class="text-[11px] uppercase tracking-[0.16em] text-slate-400">Sondages</p>
                  <p class="mt-2 text-lg font-semibold text-slate-950">{{ channel.polls.length }}</p>
                </div>
              </div>

              <div class="mt-5">
                <AppButton as="router-link" :to="`/chaines/${channel.slug}`" variant="secondary" size="md" full-width>
                  Voir la chaîne
                </AppButton>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { channels, channelToneClasses, type ChannelEntry } from '@/data/channels'

const route = useRoute()

const fallbackChannel = channels[0] as ChannelEntry

const channel = computed<ChannelEntry>(() => {
  const slug = String(route.params.slug ?? fallbackChannel.slug)
  return channels.find((item) => item.slug === slug) ?? fallbackChannel
})

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
</script>

<template>
  <main class="pb-24 pt-32">
      <section class="section pb-10">
        <div class="container flex flex-col gap-8">
          <div class="flex flex-col gap-6 rounded-[2.5rem] border border-slate-200 bg-white p-7 shadow-[0_30px_90px_-58px_rgba(15,23,42,0.35)] sm:p-9">
            <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div class="flex min-w-0 items-start gap-5">
                <div
                  class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden bg-slate-950 text-2xl font-semibold text-white"
                  :class="channel.isOfficial ? 'rounded-[1.5rem]' : 'rounded-full'"
                >
                  {{ channel.initials }}
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
                <AppButton as="router-link" to="/chaines" variant="secondary" size="md">
                  Retour au catalogue
                </AppButton>
              </div>
            </div>

            <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4">
              <p class="text-sm font-semibold text-slate-950">Suivre permet d’être alerté à chaque nouveau contenu et d’accéder aux contenus gratuits.</p>
              <p class="mt-1 text-sm leading-6 text-slate-500">
                <span v-if="channel.hasPaidSubscription">
                  L’abonnement payant débloque les contenus réservés
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

            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div class="rounded-[1.5rem] bg-slate-950 px-5 py-5 text-white">
                <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Abonnements payants</p>
                <p class="mt-3 text-2xl font-semibold">{{ formatCompactNumber(channel.subscriptions) }}</p>
              </div>
              <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5">
                <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Suivis</p>
                <p class="mt-3 text-2xl font-semibold text-slate-950">{{ formatCompactNumber(channel.followers) }}</p>
              </div>
              <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5">
                <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Actus</p>
                <p class="mt-3 text-2xl font-semibold text-slate-950">{{ channel.articles.length }}</p>
              </div>
              <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5">
                <p class="text-xs uppercase tracking-[0.18em] text-slate-400">StatsData</p>
                <p class="mt-3 text-2xl font-semibold text-slate-950">{{ channel.statsData.length }}</p>
              </div>
              <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5">
                <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Sondages</p>
                <p class="mt-3 text-2xl font-semibold text-slate-950">{{ channel.polls.length }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section pt-2">
        <div class="container grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div class="flex flex-col gap-6">
            <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Dernières actus</p>
              <div class="mt-5 grid gap-4">
                <article v-for="item in channel.articles" :key="item" class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p class="text-base font-semibold leading-7 text-slate-950">{{ item }}</p>
                </article>
              </div>
            </div>

            <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Dernières StatsData</p>
              <div class="mt-5 grid gap-4">
                <article v-for="item in channel.statsData" :key="item" class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p class="text-base font-semibold leading-7 text-slate-950">{{ item }}</p>
                </article>
              </div>
            </div>

            <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Derniers sondages</p>
              <div class="mt-5 grid gap-4">
                <article v-for="item in channel.polls" :key="item" class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p class="text-base font-semibold leading-7 text-slate-950">{{ item }}</p>
                </article>
              </div>
            </div>
          </div>

          <aside class="flex flex-col gap-5">
            <div class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Positionnement</p>
              <p class="mt-4 text-sm leading-7 text-slate-300">
                Cette page détail rassemble les thématiques, les signaux et les formats d’une chaîne dans une lecture plus éditoriale que le simple catalogue.
              </p>
            </div>

            <div class="rounded-[2rem] border border-slate-200 bg-white p-6">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Navigation</p>
              <div class="mt-4 flex flex-col gap-3">
                <AppButton as="router-link" to="/fil-actus" variant="secondary" size="md">
                  Voir le fil d’actus
                </AppButton>
                <AppButton as="router-link" to="/articles" variant="outline" size="md">
                  Explorer les articles
                </AppButton>
              </div>
            </div>
          </aside>
        </div>
      </section>
  </main>
</template>

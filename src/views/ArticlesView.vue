<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { articleSummaries } from '@/data/articles'
import { sharedPromoItems } from '@/data/promo-items'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppPromoBanner from '@/components/layout/AppPromoBanner.vue'
import AppButton from '@/components/ui/AppButton.vue'

const featuredArticle = {
  category: 'Politique',
  title: 'Présidentielle 2027 : les bassins d’indécision qui peuvent faire basculer le second tour',
  summary:
    'Un dossier construit à partir des dernières vagues d’opinion, des dynamiques locales et des signaux d’engagement observés sur les principales thématiques de campagne.',
  stats: [
    { label: 'Temps de lecture', value: '8 min' },
    { label: 'Sources croisées', value: '14' },
    { label: 'Mise à jour', value: 'Il y a 2 h' },
  ],
}

const filters = ['Tous', 'Politique', 'Économie', 'Santé', 'Climat', 'Société']

const articles = articleSummaries

const editorialPillars = [
  {
    title: 'Formats lisibles',
    detail: 'Chaque article est pensé pour aller vite du signal brut à l’insight éditorial.',
  },
  {
    title: 'Sources vérifiables',
    detail: 'Les chiffres, notes de contexte et comparaisons restent consultables à chaque étape.',
  },
  {
    title: 'Publication continue',
    detail: 'Les dossiers peuvent être enrichis en direct quand une donnée bouge vraiment.',
  },
]

const sidebarItems = [
  {
    label: 'À surveiller',
    title: 'Municipales 2026',
    detail: 'Cartes locales, rapports de force et chroniques de campagne en continu.',
  },
  {
    label: 'Format maison',
    title: 'Le scan hebdo',
    detail: 'Trois tendances, un angle clair, des chiffres directement exploitables.',
  },
  {
    label: 'Signal en hausse',
    title: 'Inflation alimentaire',
    detail: 'Sujet le plus consulté sur les 72 dernières heures.',
  },
]
</script>

<template>
  <div class="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_18%,#eef4ff_100%)] text-slate-900">
    <AppPromoBanner :items="sharedPromoItems" />
    <AppHeader />

    <main class="pb-24 pt-32">
      <section class="section pb-10">
        <div class="container grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:items-start">
          <div class="flex flex-col gap-8">
            <div class="flex flex-col gap-5">
              <p class="eyebrow text-primary">Rédaction & insights</p>
              <div class="flex max-w-4xl flex-col gap-4">
                <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                  Une page articles pensée pour lire les signaux avant tout le monde.
                </h1>
                <p class="max-w-3xl text-lg leading-8 text-slate-600">
                  Décryptages, formats longs et analyses enrichies par les données. Chaque sujet combine angle
                  éditorial clair, preuves consultables et mise à jour continue.
                </p>
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-3">
              <div
                v-for="stat in featuredArticle.stats"
                :key="stat.label"
                class="rounded-[1.75rem] border border-slate-200 bg-white/80 px-5 py-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]"
                >
                <div class="flex flex-col gap-3">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{{ stat.label }}</p>
                  <p class="text-2xl font-semibold text-slate-950">{{ stat.value }}</p>
                </div>
              </div>
            </div>

            <article
              class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_40px_110px_-58px_rgba(59,130,246,0.45)]"
            >
              <div class="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div class="flex flex-col gap-6 p-7 sm:p-9">
                  <span class="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                    {{ featuredArticle.category }}
                  </span>
                  <div class="flex flex-col gap-4">
                    <h2 class="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-slate-950">
                      {{ featuredArticle.title }}
                    </h2>
                    <p class="max-w-2xl text-base leading-7 text-slate-600">
                      {{ featuredArticle.summary }}
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-3">
                    <AppButton as="router-link" to="/login" variant="primary" size="md">
                      Ouvrir le studio
                    </AppButton>
                    <AppButton variant="secondary" size="md">Partager le format</AppButton>
                  </div>
                </div>

                <div class="bg-slate-950 p-7 text-white sm:p-9">
                  <div class="flex flex-col gap-6">
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Vue rapide</p>
                    <div class="flex items-end gap-3">
                      <div class="h-12 w-6 rounded-full bg-white/25"></div>
                      <div class="h-24 w-6 rounded-full bg-accent"></div>
                      <div class="h-36 w-6 rounded-full bg-white"></div>
                      <div class="h-20 w-6 rounded-full bg-primary"></div>
                      <div class="h-28 w-6 rounded-full bg-secondary"></div>
                    </div>
                    <p class="text-sm leading-6 text-slate-300">
                      Un bloc héro volontairement simple: la page met la lecture et la hiérarchie éditoriale avant le décor.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <aside class="flex flex-col gap-4">
            <div class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Ligne éditoriale</p>
              <div class="mt-5 flex flex-col gap-5">
                <div v-for="item in editorialPillars" :key="item.title" class="rounded-[1.5rem] bg-white/8 p-4">
                  <div class="flex flex-col gap-2">
                    <p class="text-sm font-semibold text-white">{{ item.title }}</p>
                    <p class="text-sm leading-6 text-slate-300">{{ item.detail }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-[2rem] border border-slate-200 bg-white p-6">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">En ce moment</p>
              <div class="mt-5 flex flex-col gap-4">
                <div v-for="item in sidebarItems" :key="item.title" class="rounded-[1.5rem] bg-slate-50 p-4">
                  <div class="flex flex-col gap-2">
                    <p class="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{{ item.label }}</p>
                    <p class="text-base font-semibold text-slate-950">{{ item.title }}</p>
                    <p class="text-sm leading-6 text-slate-500">{{ item.detail }}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section class="section pt-8">
        <div class="container flex flex-col gap-8">
          <div class="flex flex-wrap items-center justify-between gap-5">
            <div class="flex flex-col gap-2">
              <p class="eyebrow">Sélection</p>
              <h2 class="text-3xl font-semibold text-slate-950">Les derniers articles à fort signal</h2>
            </div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="filter in filters"
                :key="filter"
                class="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
              >
                {{ filter }}
              </span>
            </div>
          </div>

          <div class="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <RouterLink
              v-for="item in articles"
              :key="item.slug"
              :to="`/articles/${item.slug}`"
              class="group flex h-full flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_26px_80px_-54px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 hover:border-primary/25"
            >
              <div
                v-if="'image' in item"
                class="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-100"
              >
                <img
                  :src="item.image"
                  :alt="item.title"
                  class="h-48 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>

              <div class="flex items-start justify-between gap-4">
                <span class="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                  {{ item.category }}
                </span>
                <div class="text-right">
                  <p class="text-sm font-semibold text-primary">{{ item.signal }}</p>
                  <p class="text-xs uppercase tracking-[0.18em] text-slate-400">{{ item.signalLabel }}</p>
                </div>
              </div>

              <div class="flex flex-1 flex-col gap-4">
                <h3 class="text-2xl font-semibold leading-tight tracking-[-0.03em] text-slate-950">
                  {{ item.title }}
                </h3>
                <p class="text-sm leading-7 text-slate-600">
                  {{ item.excerpt }}
                </p>
              </div>

              <div class="flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
                <span>{{ item.author }}</span>
                <span>{{ item.readTime }}</span>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>

      <section class="section pt-4">
        <div class="container">
          <div class="rounded-[2.5rem] border border-slate-200 bg-white px-6 py-8 shadow-[0_40px_120px_-66px_rgba(15,23,42,0.4)] sm:px-8 lg:px-10">
            <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div class="flex flex-col gap-4">
                <p class="eyebrow text-primary">Publier sur Statsio</p>
                <h2 class="text-3xl font-semibold text-slate-950">Votre rédaction peut passer du signal à l’article sans changer d’outil.</h2>
                <p class="max-w-2xl text-base leading-7 text-slate-600">
                  Brief éditorial, données, notes de contexte, visualisations et diffusion: la page articles s’inscrit dans un flux de production plus large.
                </p>
              </div>
              <div class="flex flex-wrap gap-3">
                <AppButton as="router-link" to="/register" variant="primary" size="md">
                  Créer un espace
                </AppButton>
                <AppButton as="router-link" to="/login" variant="outline" size="md">
                  Voir la démo
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

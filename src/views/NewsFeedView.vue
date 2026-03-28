<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { articleDetails, articleSummaries } from '@/data/articles'
import { sharedPromoItems } from '@/data/promo-items'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppPromoBanner from '@/components/layout/AppPromoBanner.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'

const timelineAuthors = [
  { name: 'Statsio Politique', handle: '@statsio_pol', accent: 'bg-primary' },
  { name: 'Statsio Eco', handle: '@statsio_eco', accent: 'bg-secondary' },
  { name: 'Statsio Data', handle: '@statsio_data', accent: 'bg-accent' },
] as const

const timelineItems = computed(() =>
  articleSummaries.map((article, index) => {
    const authorMeta = timelineAuthors[index % timelineAuthors.length] ?? timelineAuthors[0]
    const detail = articleDetails[article.slug]
    const lead = detail?.intro ?? article.excerpt
    const body = detail?.body?.[0] ?? article.excerpt

    return {
      ...article,
      authorMeta,
      publishedLabel: `${index + 1} h`,
      reactions: 120 + index * 37,
      shares: 18 + index * 9,
      bookmarks: 7 + index * 4,
      lead,
      body,
    }
  }),
)

const spotlightItems = [
  'Tri auto des sujets avec le plus de signal',
  'Passage immédiat du fil à la fiche article complète',
  'Format pensé pour les revues rapides en équipe',
]
</script>

<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top,#eef4ff_0%,#f8fafc_32%,#ffffff_100%)] text-slate-900">
    <AppPromoBanner :items="sharedPromoItems" />
    <AppHeader />

    <main class="pb-24 pt-32">
      <section class="section pb-8">
        <div class="container grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div class="flex flex-col gap-6">
            <p class="eyebrow text-primary">Fil d’actus</p>
            <div class="max-w-4xl space-y-4">
              <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                Les articles, relus comme un fil social rapide à scanner.
              </h1>
              <p class="max-w-3xl text-lg leading-8 text-slate-600">
                Chaque carte reprend un article existant avec un rythme plus court: angle, signal fort, contexte et lien direct vers la version longue.
              </p>
            </div>
          </div>

          <aside class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)]">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Pourquoi ce format</p>
            <div class="mt-5 flex flex-col gap-3">
              <div v-for="item in spotlightItems" :key="item" class="rounded-[1.25rem] bg-white/8 px-4 py-3 text-sm leading-6 text-slate-200">
                {{ item }}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section class="section pt-2">
        <div class="container grid gap-8 lg:grid-cols-[minmax(0,760px)_minmax(280px,320px)] lg:justify-between">
          <div class="flex flex-col gap-5">
            <article
              v-for="item in timelineItems"
              :key="item.slug"
              class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.38)] sm:p-6"
            >
              <div class="flex gap-4">
                <div class="pt-1">
                  <div class="rounded-full p-[2px]" :class="item.authorMeta.accent">
                    <AppAvatar :initials="item.authorMeta.name.slice(0, 2).toUpperCase()" size="md" />
                  </div>
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p class="text-sm font-semibold text-slate-950">{{ item.authorMeta.name }}</p>
                    <p class="text-sm text-slate-500">{{ item.authorMeta.handle }}</p>
                    <span class="text-slate-300">·</span>
                    <p class="text-sm text-slate-500">il y a {{ item.publishedLabel }}</p>
                  </div>

                  <div class="mt-4 flex flex-col gap-4">
                    <span class="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                      {{ item.category }}
                    </span>

                    <div class="space-y-3">
                      <h2 class="text-2xl font-semibold leading-tight tracking-[-0.03em] text-slate-950">
                        {{ item.title }}
                      </h2>
                      <p class="text-base leading-7 text-slate-700">
                        {{ item.lead }}
                      </p>
                      <p class="rounded-[1.5rem] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                        {{ item.body }}
                      </p>
                    </div>

                    <div
                      v-if="item.image"
                      class="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-100"
                    >
                      <img :src="item.image" :alt="item.title" class="h-56 w-full object-cover" />
                    </div>

                    <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <div class="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span>{{ item.reactions }} j’aime</span>
                        <span>{{ item.shares }} partages</span>
                        <span>{{ item.bookmarks }} enregistrements</span>
                      </div>

                      <AppButton as="router-link" :to="`/articles/${item.slug}`" variant="secondary" size="sm">
                        Lire l’article
                      </AppButton>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <aside class="flex flex-col gap-5">
            <div class="rounded-[2rem] border border-slate-200 bg-white p-6">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">En tête de flux</p>
              <div class="mt-5 flex flex-col gap-4">
                <RouterLink
                  v-for="item in timelineItems.slice(0, 3)"
                  :key="item.slug"
                  :to="`/articles/${item.slug}`"
                  class="rounded-[1.5rem] bg-slate-50 px-4 py-4 transition hover:bg-slate-100"
                >
                  <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{{ item.category }}</p>
                  <p class="mt-2 text-base font-semibold text-slate-950">{{ item.title }}</p>
                  <p class="mt-2 text-sm leading-6 text-slate-500">{{ item.signal }} {{ item.signalLabel }}</p>
                </RouterLink>
              </div>
            </div>

            <div class="rounded-[2rem] border border-slate-200 bg-white p-6">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Accès rapides</p>
              <div class="mt-5 flex flex-col gap-3">
                <AppButton as="router-link" to="/articles" variant="secondary" size="md">
                  Voir tous les articles
                </AppButton>
                <AppButton as="router-link" to="/profile" variant="outline" size="md">
                  Revenir au profil
                </AppButton>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

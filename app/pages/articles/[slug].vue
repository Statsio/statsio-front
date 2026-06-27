<script setup lang="ts">
definePageMeta({ layout: 'default' })
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { articleDetails, type ArticleDetail } from '@/data/articles'
import AppButton from '@/components/ui/AppButton.vue'

const route = useRoute()

const fallbackSlug = 'presidentielle-2027-bassins-indecision'
const fallbackArticle = articleDetails[fallbackSlug] as ArticleDetail

const article = computed<ArticleDetail>(() => {
  const slug = String(route.params.slug ?? fallbackSlug)

  return articleDetails[slug] ?? fallbackArticle
})

usePageSeo({
  title: computed(() => article.value.title),
  description: computed(() => article.value.intro),
  image: computed(() => article.value.image),
  type: 'article',
})

const relatedArticles = [
  {
    slug: 'inflation-qui-retrouve-un-peu-dair-en-2026',
    category: 'Économie',
    title: 'Inflation : qui retrouve un peu d’air en 2026 ?',
  },
  {
    slug: 'presidentielle-2027-bassins-indecision',
    category: 'Politique',
    title: 'Présidentielle 2027 : les bassins d’indécision qui peuvent faire basculer le second tour',
  },
]

const sources = [
  'Baromètres d’opinion consolidés sur 8 semaines',
  'Comparaisons territoriales issues des séries Statsio',
  'Historique de variations par segments démographiques',
]
</script>

<template>
  <main class="pb-24 pt-4">
      <section class="section pb-10">
        <div class="container flex flex-col gap-10">
          <div class="flex flex-col gap-5">
            <p class="eyebrow text-primary">{{ article.category }}</p>
            <div class="flex max-w-5xl flex-col gap-4">
              <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                {{ article.title }}
              </h1>
              <p class="max-w-3xl text-lg leading-8 text-slate-600">
                {{ article.intro }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
              <span>{{ article.author }}</span>
              <span>{{ article.publishedAt }}</span>
              <span>{{ article.readTime }}</span>
            </div>
          </div>

          <div class="overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-[0_36px_110px_-62px_rgba(15,23,42,0.45)]">
            <img :src="article.image" :alt="article.title" class="h-[280px] w-full object-cover sm:h-[360px] lg:h-[460px]" />
          </div>

          <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <article class="flex flex-col gap-8 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.35)] sm:p-9">
              <div class="grid gap-4 sm:grid-cols-3">
                <div
                  v-for="stat in article.stats"
                  :key="stat.label"
                  class="rounded-[1.5rem] bg-slate-50 px-5 py-4"
                >
                  <div class="flex flex-col gap-2">
                    <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{{ stat.label }}</p>
                    <p class="text-2xl font-semibold text-slate-950">{{ stat.value }}</p>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-6">
                <p
                  v-for="paragraph in article.body"
                  :key="paragraph"
                  class="text-base leading-8 text-slate-700"
                >
                  {{ paragraph }}
                </p>
              </div>

              <div class="rounded-[1.75rem] bg-slate-950 p-6 text-white">
                <div class="flex flex-col gap-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">À retenir</p>
                  <ul class="flex flex-col gap-3 text-sm leading-7 text-slate-200">
                    <li v-for="point in article.keyPoints" :key="point" class="flex items-start gap-3">
                      <span class="mt-2 h-2 w-2 rounded-full bg-primary"></span>
                      <span>{{ point }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </article>

            <aside class="flex flex-col gap-5">
              <div class="rounded-[2rem] border border-slate-200 bg-white p-6">
                <div class="flex flex-col gap-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Contexte</p>
                  <p class="text-sm leading-7 text-slate-600">
                    Cette page article donne plus de densité éditoriale: un visuel fort, une lecture propre et des blocs latéraux utiles au lieu d’un simple template de blog générique.
                  </p>
                </div>
              </div>

              <div class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">
                <div class="flex flex-col gap-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Sources</p>
                  <ul class="flex flex-col gap-3 text-sm leading-7 text-slate-300">
                    <li v-for="source in sources" :key="source">{{ source }}</li>
                  </ul>
                </div>
              </div>

              <div class="rounded-[2rem] border border-slate-200 bg-white p-6">
                <div class="flex flex-col gap-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Suite</p>
                  <AppButton as="router-link" to="/articles" variant="secondary" size="md">
                    Revenir aux articles
                  </AppButton>
                  <AppButton as="router-link" to="/login" variant="primary" size="md">
                    Ouvrir le studio
                  </AppButton>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section class="section pt-0">
        <div class="container flex flex-col gap-8">
          <div class="flex flex-col gap-2">
            <p class="eyebrow">À lire aussi</p>
            <h2 class="text-3xl font-semibold text-slate-950">Autres articles liés</h2>
          </div>

          <div class="grid gap-6 lg:grid-cols-2">
            <RouterLink
              v-for="item in relatedArticles"
              :key="item.slug"
              :to="`/articles/${item.slug}`"
              class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 hover:border-primary/30"
            >
              <div class="flex flex-col gap-4">
                <span class="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                  {{ item.category }}
                </span>
                <h3 class="text-2xl font-semibold leading-tight tracking-[-0.03em] text-slate-950">
                  {{ item.title }}
                </h3>
                <span class="text-sm font-semibold text-primary">Lire l’article</span>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>
  </main>
</template>

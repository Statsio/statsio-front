<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { fetchPublicStatsDataDocuments, type StatsDataPublicListItemDto } from '@/api/statsdata-documents'

const heroStats = [
  { label: 'Séries suivies', value: '2.4k' },
  { label: 'APIs connectées', value: '18' },
  { label: 'Mises à jour', value: 'Temps réel' },
]

const filters = ['Tous', 'Économie', 'Santé', 'Territoires', 'Élections', 'Audience']

const isLoading = ref(true)
const loadError = ref<string | null>(null)
const datasets = ref<StatsDataPublicListItemDto[]>([])

const visibleDatasets = computed(() => datasets.value.filter((d) => d.slug && d.title))

function formatUpdated(iso: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date)
}

onMounted(async () => {
  isLoading.value = true
  loadError.value = null
  try {
    datasets.value = await fetchPublicStatsDataDocuments()
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Erreur lors du chargement'
    datasets.value = []
  } finally {
    isLoading.value = false
  }
})

const featurePanels = [
  {
    title: 'Comparaisons rapides',
    detail: 'Basculez entre territoires, périodes et segments sans casser la lecture.',
  },
  {
    title: 'Blocs réutilisables',
    detail: 'Tableaux, badges de statut, mini-graphiques et exports dans un même flux.',
  },
  {
    title: 'Connexion éditoriale',
    detail: 'Chaque StatsData peut alimenter un article, une note interne ou un baromètre public.',
  },
]

const quickSignals = [
  {
    label: 'À surveiller',
    title: 'Inflation alimentaire',
    detail: 'Sujet le plus consulté sur les 72 dernières heures.',
  },
  {
    label: 'En hausse',
    title: 'Participation locale',
    detail: 'Forte progression des comparaisons par commune cette semaine.',
  },
  {
    label: 'Focus',
    title: 'Santé mentale',
    detail: 'Nouvelles données croisées avec âge, région et niveau d’études.',
  },
]
</script>

<template>
  <main class="pb-24 pt-32">
      <section class="section pb-10">
        <div class="container grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_320px] lg:items-start">
          <div class="flex flex-col gap-8">
            <div class="flex flex-col gap-5">
              <p class="eyebrow text-accent">StatsData & exploration</p>
              <div class="flex max-w-4xl flex-col gap-4">
                <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                  Une page StatsData faite pour explorer, comparer et publier sans friction.
                </h1>
                <p class="max-w-3xl text-lg leading-8 text-slate-600">
                  Des pages vivantes branchées à vos APIs, avec des signaux lisibles, des comparaisons rapides et des blocs exploitables directement dans vos formats éditoriaux.
                </p>
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-3">
              <div
                v-for="stat in heroStats"
                :key="stat.label"
                class="rounded-[1.75rem] border border-slate-200 bg-white/85 px-5 py-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]"
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
              <div class="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div class="flex flex-col gap-6 p-7 sm:p-9">
                  <span class="inline-flex w-fit rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                    Économie locale
                  </span>
                  <div class="flex flex-col gap-4">
                    <h2 class="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-slate-950">
                      Inflation par ville en France
                    </h2>
                    <p class="max-w-2xl text-base leading-7 text-slate-600">
                      Un cockpit de lecture pour suivre les écarts de prix, repérer les zones sous tension et comparer les signaux sans sortir du contexte.
                    </p>
                  </div>

                  <div class="grid gap-3 sm:grid-cols-3">
                    <div class="rounded-[1.5rem] bg-slate-50 px-4 py-4">
                      <div class="flex flex-col gap-2">
                        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Couverture</p>
                        <p class="text-lg font-semibold text-slate-950">23 villes</p>
                      </div>
                    </div>
                    <div class="rounded-[1.5rem] bg-slate-50 px-4 py-4">
                      <div class="flex flex-col gap-2">
                        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Actualisation</p>
                        <p class="text-lg font-semibold text-slate-950">Continue</p>
                      </div>
                    </div>
                    <div class="rounded-[1.5rem] bg-slate-50 px-4 py-4">
                      <div class="flex flex-col gap-2">
                        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Exports</p>
                        <p class="text-lg font-semibold text-slate-950">CSV, PNG</p>
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-3">
                    <AppButton as="router-link" to="/login" variant="primary" size="md">
                      Ouvrir la base
                    </AppButton>
                    <AppButton variant="secondary" size="md">Partager la vue</AppButton>
                  </div>
                </div>

                <div class="bg-slate-950 p-7 text-white sm:p-9">
                  <div class="flex flex-col gap-6">
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Vue synthétique</p>
                    <div class="rounded-[1.75rem] bg-white/8 p-5">
                      <div class="flex flex-col gap-4">
                        <div class="flex items-end gap-3">
                          <div class="h-12 w-4 rounded-full bg-white/20"></div>
                          <div class="h-20 w-4 rounded-full bg-accent"></div>
                          <div class="h-32 w-4 rounded-full bg-white"></div>
                          <div class="h-24 w-4 rounded-full bg-primary"></div>
                          <div class="h-16 w-4 rounded-full bg-secondary"></div>
                        </div>
                        <div class="grid grid-cols-3 gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                          <span>Paris</span>
                          <span>Lyon</span>
                          <span>Lille</span>
                        </div>
                      </div>
                    </div>
                    <p class="text-sm leading-6 text-slate-300">
                      Une interface dense, mais lisible: les signaux utiles remontent vite, les détails restent accessibles sans surcharger la page.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <aside class="flex flex-col gap-4">
            <div class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Pourquoi ça marche</p>
              <div class="mt-5 flex flex-col gap-5">
                <div v-for="panel in featurePanels" :key="panel.title" class="rounded-[1.5rem] bg-white/8 p-4">
                  <div class="flex flex-col gap-2">
                    <p class="text-sm font-semibold text-white">{{ panel.title }}</p>
                    <p class="text-sm leading-6 text-slate-300">{{ panel.detail }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-[2rem] border border-slate-200 bg-white p-6">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">En ce moment</p>
              <div class="mt-5 flex flex-col gap-4">
                <div v-for="item in quickSignals" :key="item.title" class="rounded-[1.5rem] bg-slate-50 p-4">
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
              <p class="eyebrow">Catalogue</p>
              <h2 class="text-3xl font-semibold text-slate-950">Les StatsData les plus consultées</h2>
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

          <div
            v-if="isLoading"
            class="rounded-[2rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]"
          >
            <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Chargement</p>
            <h3 class="mt-3 text-2xl font-semibold text-slate-950">On récupère les StatsData publiques.</h3>
          </div>

          <div
            v-else-if="loadError"
            class="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-12 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]"
          >
            <p class="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">Erreur</p>
            <h3 class="mt-3 text-2xl font-semibold text-slate-950">Impossible de charger le catalogue.</h3>
            <p class="mx-auto mt-3 max-w-2xl text-sm leading-7 text-rose-900/80">{{ loadError }}</p>
          </div>

          <div
            v-else-if="visibleDatasets.length === 0"
            class="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]"
          >
            <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Aucune StatsData</p>
            <h3 class="mt-3 text-2xl font-semibold text-slate-950">Le catalogue public est vide pour l’instant.</h3>
          </div>

          <div v-else class="grid gap-6 lg:grid-cols-2">
            <RouterLink
              v-for="item in visibleDatasets"
              :key="item.id"
              :to="`/statsdata/${item.slug}`"
              class="flex h-full flex-col gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_26px_80px_-54px_rgba(15,23,42,0.45)]"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex flex-col gap-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {{ item.author ?? 'Statsio' }}
                  </p>
                  <h3 class="text-2xl font-semibold leading-tight tracking-[-0.03em] text-slate-950">
                    {{ item.title }}
                  </h3>
                </div>
                <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {{ formatUpdated(item.updated_at) }}
                </span>
              </div>

              <p class="text-sm leading-7 text-slate-600">
                {{ item.subtitle ?? '—' }}
              </p>

              <div class="flex flex-wrap gap-2">
                <span class="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
                  Public
                </span>
                <span class="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
                  Créée le {{ formatUpdated(item.created_at) }}
                </span>
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
                <p class="eyebrow text-accent">Brancher vos données</p>
                <h2 class="text-3xl font-semibold text-slate-950">
                  Vos datasets peuvent devenir des pages lisibles, comparables et directement publiables.
                </h2>
                <p class="max-w-2xl text-base leading-7 text-slate-600">
                  Connectez vos sources, structurez vos métriques et servez des vues plus utiles que de simples tableaux bruts.
                </p>
              </div>
              <div class="flex flex-wrap gap-3">
                <AppButton as="router-link" to="/register" variant="primary" size="md">
                  Créer une StatsData
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
</template>

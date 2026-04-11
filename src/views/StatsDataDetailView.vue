<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { sharedPromoItems } from '@/data/promo-items'
import StatsDataInflationDashboard from '@/components/statsdata/StatsDataInflationDashboard.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppPromoBanner from '@/components/layout/AppPromoBanner.vue'
import AppButton from '@/components/ui/AppButton.vue'

const route = useRoute()

const statsDataEntries = {
  'inflation-par-ville-en-france': {
    scope: 'Économie locale',
    title: 'Inflation par ville en France',
    intro:
      'Une vue conçue pour suivre les écarts de prix, repérer les zones de tension et croiser rapidement les signaux de consommation à l’échelle locale.',
    updated: 'Mis à jour il y a 12 min',
    stats: [
      { label: 'Villes suivies', value: '24' },
      { label: 'Indicateurs', value: '7' },
      { label: 'Historique', value: '36 mois' },
    ],
    highlights: [
      'Paris et Lyon restent au-dessus de la moyenne sur les dépenses contraintes.',
      'La pression ralentit sur l’énergie, mais l’alimentaire reste haut dans plusieurs métropoles.',
      'Le signal de détente est plus net dans les villes intermédiaires que dans les très grands centres urbains.',
    ],
    metrics: ['IPC', 'Logement', 'Énergie', 'Alimentation', 'Revenus'],
    narrative: [
      'La lecture par ville permet de sortir d’une moyenne nationale trop lisse. Les écarts de coût de la vie ne produisent pas les mêmes arbitrages à Lille, Bordeaux ou Marseille, et les effets de rattrapage ne suivent pas le même rythme.',
      'Ce dataset sert surtout à comparer les tensions relatives. Il montre où la pression s’atténue réellement, où elle se déplace vers d’autres postes de dépense, et comment ces variations modifient la perception du pouvoir d’achat.',
      'En pratique, la valeur de cette StatsData tient à sa lisibilité: la hiérarchie des signaux remonte vite, tandis que les détails restent accessibles sans casser la navigation.',
    ],
  },
  'sante-mentale-des-18-25-ans': {
    scope: 'Santé publique',
    title: 'Santé mentale des 18-25 ans',
    intro:
      'Une base vivante pour suivre stress, sommeil, isolement et accès aux soins, avec une lecture croisée par territoire et profil.',
    updated: 'Actualisé il y a 2 h',
    stats: [
      { label: 'Segments', value: '18' },
      { label: 'Variables', value: '5' },
      { label: 'Fréquence', value: 'Hebdo' },
    ],
    highlights: [
      'Le niveau de stress reste structurellement haut chez les jeunes actifs précaires.',
      'Les écarts territoriaux se creusent sur l’accès aux ressources de soutien.',
      'Le sommeil demeure l’indicateur le plus sensible aux variations de contexte.',
    ],
    metrics: ['Stress', 'Sommeil', 'Accès soins', 'Isolement', 'Prévention'],
    narrative: [
      'La force du dataset est de rendre lisible un sujet complexe sans l’écraser dans une moyenne unique. Les profils, territoires et temporalités ne racontent pas la même histoire selon les dimensions observées.',
      'La page détail permet de basculer d’un aperçu synthétique à des signaux plus fins. Elle est pensée pour un usage éditorial autant que pour l’exploration analytique.',
      'Le format privilégie les comparaisons exploitables plutôt que l’accumulation de chiffres. Chaque variation doit aider à formuler une lecture, pas seulement à remplir un tableau.',
    ],
  },
} as const

const fallbackSlug = 'inflation-par-ville-en-france'

const slug = computed(() => String(route.params.slug ?? fallbackSlug))
const isInflationDataset = computed(() => slug.value === 'inflation-par-ville-en-france')

const dataset = computed(() => {
  const key = slug.value as keyof typeof statsDataEntries
  return statsDataEntries[key] ?? statsDataEntries[fallbackSlug]
})

const relatedDatasets = [
  {
    slug: 'inflation-par-ville-en-france',
    scope: 'Économie locale',
    title: 'Inflation par ville en France',
  },
  {
    slug: 'sante-mentale-des-18-25-ans',
    scope: 'Santé publique',
    title: 'Santé mentale des 18-25 ans',
  },
]
</script>

<template>
  <div class="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_22%,#eef6ff_100%)] text-slate-900">
    <AppPromoBanner :items="sharedPromoItems" />
    <AppHeader />

    <main class="pb-24 pt-32">
      <section class="section pb-10">
        <div class="container flex flex-col gap-10">
          <div class="flex flex-col gap-5">
            <p class="eyebrow text-accent">{{ dataset.scope }}</p>
            <div class="flex max-w-5xl flex-col gap-4">
              <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                {{ dataset.title }}
              </h1>
              <p class="max-w-3xl text-lg leading-8 text-slate-600">
                {{ dataset.intro }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
              <span>{{ dataset.updated }}</span>
              <span>{{ dataset.metrics.join(' • ') }}</span>
            </div>
          </div>

          <div
            class="grid gap-8"
            :class="isInflationDataset ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start'"
          >
            <div class="flex flex-col gap-8">
              <article
                v-if="!isInflationDataset"
                class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_40px_110px_-58px_rgba(59,130,246,0.45)]"
              >
                <div class="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div class="flex flex-col gap-6 p-7 sm:p-9">
                    <div class="grid gap-4 sm:grid-cols-3">
                      <div
                        v-for="stat in dataset.stats"
                        :key="stat.label"
                        class="rounded-[1.5rem] bg-slate-50 px-4 py-4"
                      >
                        <div class="flex flex-col gap-2">
                          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{{ stat.label }}</p>
                          <p class="text-xl font-semibold text-slate-950">{{ stat.value }}</p>
                        </div>
                      </div>
                    </div>

                    <div class="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                      <div class="flex flex-col gap-4">
                        <div class="flex items-end gap-3">
                          <div class="h-14 w-5 rounded-full bg-slate-300"></div>
                          <div class="h-24 w-5 rounded-full bg-accent"></div>
                          <div class="h-32 w-5 rounded-full bg-primary"></div>
                          <div class="h-20 w-5 rounded-full bg-secondary"></div>
                          <div class="h-28 w-5 rounded-full bg-slate-950"></div>
                        </div>
                        <div class="grid grid-cols-5 gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                          <span>Paris</span>
                          <span>Lyon</span>
                          <span>Lille</span>
                          <span>Nantes</span>
                          <span>Toulouse</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="metric in dataset.metrics"
                        :key="metric"
                        class="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
                      >
                        {{ metric }}
                      </span>
                    </div>

                    <div class="flex flex-wrap gap-3">
                      <AppButton as="router-link" to="/login" variant="primary" size="md">
                        Ouvrir dans le studio
                      </AppButton>
                      <AppButton variant="secondary" size="md">Exporter la vue</AppButton>
                    </div>
                  </div>

                  <div class="bg-slate-950 p-7 text-white sm:p-9">
                    <div class="flex flex-col gap-5">
                      <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Points clés</p>
                      <div class="flex flex-col gap-4">
                        <div v-for="point in dataset.highlights" :key="point" class="rounded-[1.5rem] bg-white/8 p-4">
                          <p class="text-sm leading-6 text-slate-200">{{ point }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <template v-if="isInflationDataset">
                <div class="grid gap-4 sm:grid-cols-3">
                  <div
                    v-for="stat in dataset.stats"
                    :key="stat.label"
                    class="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 shadow-sm"
                  >
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{{ stat.label }}</p>
                    <p class="mt-2 text-xl font-semibold text-slate-950">{{ stat.value }}</p>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="metric in dataset.metrics"
                    :key="metric"
                    class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                  >
                    {{ metric }}
                  </span>
                </div>

                <StatsDataInflationDashboard />

                <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
                  <div class="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.35)] sm:p-9">
                    <div class="flex flex-col gap-6">
                      <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Lecture</p>
                      <p
                        v-for="paragraph in dataset.narrative"
                        :key="paragraph"
                        class="text-base leading-8 text-slate-700"
                      >
                        {{ paragraph }}
                      </p>
                    </div>
                  </div>
                  <div class="rounded-[2rem] bg-slate-950 p-7 text-white sm:p-8">
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Points clés</p>
                    <div class="mt-5 flex flex-col gap-4">
                      <div v-for="point in dataset.highlights" :key="point" class="rounded-[1.5rem] bg-white/8 p-4">
                        <p class="text-sm leading-6 text-slate-200">{{ point }}</p>
                      </div>
                    </div>
                    <div class="mt-8 flex flex-wrap gap-3">
                      <AppButton as="router-link" to="/login" variant="primary" size="md">Ouvrir dans le studio</AppButton>
                      <AppButton variant="secondary" size="md">Exporter la vue</AppButton>
                    </div>
                  </div>
                </div>
              </template>

              <div
                v-else
                class="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.35)] sm:p-9"
              >
                <div class="flex flex-col gap-6">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Lecture</p>
                  <p
                    v-for="paragraph in dataset.narrative"
                    :key="paragraph"
                    class="text-base leading-8 text-slate-700"
                  >
                    {{ paragraph }}
                  </p>
                </div>
              </div>
            </div>

            <aside v-if="!isInflationDataset" class="flex flex-col gap-5">
              <div class="rounded-[2rem] border border-slate-200 bg-white p-6">
                <div class="flex flex-col gap-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Utilisation</p>
                  <p class="text-sm leading-7 text-slate-600">
                    Cette page détail sert à passer du simple dataset au format éditorial exploitable, avec un niveau de contexte suffisant sans alourdir l’exploration.
                  </p>
                </div>
              </div>

              <div class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">
                <div class="flex flex-col gap-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Actions</p>
                  <AppButton as="router-link" to="/statsdata" variant="secondary" size="md" class="!bg-white !text-slate-950">
                    Revenir au catalogue
                  </AppButton>
                  <AppButton as="router-link" to="/articles" variant="light-outline" size="md">
                    Voir les articles liés
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
            <p class="eyebrow">À explorer</p>
            <h2 class="text-3xl font-semibold text-slate-950">Autres StatsData liées</h2>
          </div>

          <div class="grid gap-6 lg:grid-cols-2">
            <RouterLink
              v-for="item in relatedDatasets"
              :key="item.slug"
              :to="`/statsdata/${item.slug}`"
              class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 hover:border-accent/30"
            >
              <div class="flex flex-col gap-4">
                <span class="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                  {{ item.scope }}
                </span>
                <h3 class="text-2xl font-semibold leading-tight tracking-[-0.03em] text-slate-950">
                  {{ item.title }}
                </h3>
                <span class="text-sm font-semibold text-accent">Ouvrir la StatsData</span>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

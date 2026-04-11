<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppPromoBanner from '@/components/layout/AppPromoBanner.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { sharedPromoItems } from '@/data/promo-items'
import { useAuthStore } from '@/stores/auth'

type ContentType = 'Article' | 'Sondage' | 'StatsData'
type ContentStatus = 'Publié' | 'Brouillon' | 'En revue'
type ContentVisibility = 'Public' | 'Privé' | 'Abonnés'

type UserContentItem = {
  id: string
  type: ContentType
  title: string
  summary: string
  status: ContentStatus
  visibility: ContentVisibility
  updatedAt: string
  audience: string
  metric: string
  tone: string
  to: string
  actionLabel: string
}

const authStore = useAuthStore()
const searchQuery = ref('')
const selectedType = ref<'Tous' | ContentType>('Tous')
const selectedStatus = ref<'Tous' | ContentStatus>('Tous')
const selectedVisibility = ref<'Tous' | ContentVisibility>('Tous')
const selectedSort = ref<'recent' | 'alphabetical' | 'type'>('recent')

const contentItems: UserContentItem[] = [
  {
    id: 'article-1',
    type: 'Article',
    title: 'Présidentielle 2027 : les bassins d’indécision qui peuvent faire basculer le second tour',
    summary: 'Un format long avec cartes, signaux territoriaux et comparaisons utiles pour une relance éditoriale.',
    status: 'Publié',
    visibility: 'Public',
    updatedAt: 'Modifié il y a 2 h',
    audience: '12 480 vues',
    metric: '+18% engagement',
    tone: 'bg-primary/10 text-primary',
    to: '/articles/presidentielle-2027-bassins-indecision',
    actionLabel: 'Ouvrir',
  },
  {
    id: 'statsdata-1',
    type: 'StatsData',
    title: 'Inflation par ville en France',
    summary: 'Votre dataset principal pour comparer prix, logement, énergie et dépenses contraintes.',
    status: 'Publié',
    visibility: 'Abonnés',
    updatedAt: 'Actualisé il y a 12 min',
    audience: '23 villes suivies',
    metric: '7 indicateurs',
    tone: 'bg-accent/10 text-accent',
    to: '/statsdata/inflation-par-ville-en-france',
    actionLabel: 'Explorer',
  },
  {
    id: 'poll-1',
    type: 'Sondage',
    title: 'Baromètre municipales 2026 : priorités locales et attentes de proximité',
    summary: 'Une consultation courte pensée pour remonter vite les attentes terrain avant la prochaine publication.',
    status: 'Publié',
    visibility: 'Public',
    updatedAt: 'Clôture le 18 avril 2026',
    audience: '1 842 réponses',
    metric: '1 question',
    tone: 'bg-secondary/70 text-slate-900',
    to: '/sondages/barometre-municipales-priorites-locales',
    actionLabel: 'Consulter',
  },
  {
    id: 'article-2',
    type: 'Article',
    title: 'Déserts médicaux : les zones où l’accès se détériore le plus vite',
    summary: 'Le sujet est prêt, mais la mise en récit finale et la sélection visuelle restent à verrouiller.',
    status: 'En revue',
    visibility: 'Privé',
    updatedAt: 'Relu ce matin',
    audience: '4 commentaires internes',
    metric: '7 min',
    tone: 'bg-primary/10 text-primary',
    to: '/articles/deserts-medicaux-zones-ou-lacces-se-deteriore',
    actionLabel: 'Relire',
  },
  {
    id: 'statsdata-2',
    type: 'StatsData',
    title: 'Santé mentale des 18-25 ans',
    summary: 'Base en cours d’enrichissement pour préparer un futur dossier avec lecture par profils et territoires.',
    status: 'Brouillon',
    visibility: 'Privé',
    updatedAt: 'Travail enregistré hier',
    audience: '18 segments',
    metric: 'Hebdo',
    tone: 'bg-accent/10 text-accent',
    to: '/statsdata/sante-mentale-des-18-25-ans',
    actionLabel: 'Continuer',
  },
  {
    id: 'poll-2',
    type: 'Sondage',
    title: 'Plateformes vidéo : usages quotidiens et arbitrages',
    summary: 'Un questionnaire multi-questions déjà structuré, prêt à être remis en avant ou enrichi.',
    status: 'En revue',
    visibility: 'Abonnés',
    updatedAt: 'Mis à jour cette semaine',
    audience: '2 674 réponses',
    metric: '3 questions',
    tone: 'bg-secondary/70 text-slate-900',
    to: '/sondages/plateformes-video-usage-quotidien',
    actionLabel: 'Réouvrir',
  },
]

const createActions = [
  {
    title: 'Nouvel article',
    detail: 'Lancer un format éditorial à partir d’un angle ou d’un signal.',
    to: '/articles',
  },
  {
    title: 'Nouveau sondage',
    detail: 'Préparer une nouvelle vague de réponses et qualifier une audience.',
    to: '/sondages',
  },
  {
    title: 'Nouveau StatsData',
    detail: 'Structurer une base de données exploitable et partageable.',
    to: '/statsdata',
  },
]

const typeFilters: Array<'Tous' | ContentType> = ['Tous', 'Article', 'Sondage', 'StatsData']
const statusOptions: Array<'Tous' | ContentStatus> = ['Tous', 'Publié', 'Brouillon', 'En revue']
const visibilityOptions: Array<'Tous' | ContentVisibility> = ['Tous', 'Public', 'Privé', 'Abonnés']

const filteredContentItems = computed(() => {
  const normalizedSearch = searchQuery.value.trim().toLowerCase()

  const filtered = contentItems.filter((item) => {
    const matchesSearch =
      !normalizedSearch ||
      item.title.toLowerCase().includes(normalizedSearch) ||
      item.summary.toLowerCase().includes(normalizedSearch) ||
      item.type.toLowerCase().includes(normalizedSearch)

    const matchesType = selectedType.value === 'Tous' || item.type === selectedType.value
    const matchesStatus = selectedStatus.value === 'Tous' || item.status === selectedStatus.value
    const matchesVisibility =
      selectedVisibility.value === 'Tous' || item.visibility === selectedVisibility.value

    return matchesSearch && matchesType && matchesStatus && matchesVisibility
  })

  if (selectedSort.value === 'alphabetical') {
    return [...filtered].sort((left, right) => left.title.localeCompare(right.title, 'fr'))
  }

  if (selectedSort.value === 'type') {
    return [...filtered].sort((left, right) => left.type.localeCompare(right.type, 'fr'))
  }

  return filtered
})

const counters = computed(() => {
  const total = contentItems.length
  const published = contentItems.filter((item) => item.status === 'Publié').length
  const drafts = contentItems.filter((item) => item.status === 'Brouillon').length
  const review = contentItems.filter((item) => item.status === 'En revue').length

  return [
    { label: 'Total contenus', value: String(total) },
    { label: 'Publiés', value: String(published) },
    { label: 'Brouillons', value: String(drafts) },
    { label: 'En revue', value: String(review) },
  ]
})

const resultLabel = computed(() => {
  const count = filteredContentItems.value.length

  return `${count} contenu${count > 1 ? 's' : ''}`
})

const resetFilters = () => {
  searchQuery.value = ''
  selectedType.value = 'Tous'
  selectedStatus.value = 'Tous'
  selectedVisibility.value = 'Tous'
  selectedSort.value = 'recent'
}
</script>

<template>
  <div class="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_16%,#eef4ff_100%)] text-slate-900">
    <AppPromoBanner :items="sharedPromoItems" />
    <AppHeader />

    <main class="pb-24 pt-32">
      <section class="section pb-8">
        <div class="container flex flex-col gap-8">
          <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px] xl:items-start">
            <div class="flex flex-col gap-5">
              <p class="eyebrow text-primary">Studio créateur</p>
              <div class="max-w-4xl">
                <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                  Mes contenus
                </h1>
                <p class="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                  Retrouvez tous vos articles, sondages et StatsData dans une seule vue pour chercher, filtrer,
                  reprendre et publier plus vite.
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span class="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700">
                  {{ authStore.displayName }}
                </span>
                <span>Organisation claire, reprise rapide, actions directes.</span>
              </div>
            </div>

            <aside class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_28px_80px_-48px_rgba(15,23,42,0.55)]">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Ajouter un contenu</p>
              <div class="mt-5 flex flex-col gap-3">
                <RouterLink
                  v-for="action in createActions"
                  :key="action.title"
                  :to="action.to"
                  class="group rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-4 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <p class="text-base font-semibold text-white">{{ action.title }}</p>
                      <p class="mt-2 text-sm leading-6 text-slate-300">{{ action.detail }}</p>
                    </div>
                    <span class="pt-0.5 text-lg text-white transition group-hover:translate-x-0.5">+</span>
                  </div>
                </RouterLink>
              </div>
            </aside>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article
              v-for="counter in counters"
              :key="counter.label"
              class="rounded-[1.75rem] border border-slate-200 bg-white/85 px-5 py-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]"
            >
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{{ counter.label }}</p>
              <p class="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{{ counter.value }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="section pt-4">
        <div class="container flex flex-col gap-6">
          <div class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_30px_90px_-58px_rgba(15,23,42,0.42)] sm:p-6">
            <div class="flex flex-col gap-5">
              <div class="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_220px_220px_220px]">
                <div class="flex flex-col gap-2">
                  <label for="content-search" class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Rechercher
                  </label>
                  <div class="flex items-center gap-3 rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-primary/30 focus-within:bg-white">
                    <svg viewBox="0 0 24 24" class="h-5 w-5 text-slate-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M21 21L16.65 16.65M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <input
                      id="content-search"
                      v-model="searchQuery"
                      type="search"
                      placeholder="Titre, résumé, type de contenu..."
                      class="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <label class="flex flex-col gap-2">
                  <span class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Statut</span>
                  <select
                    v-model="selectedStatus"
                    class="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-primary/30 focus:bg-white focus:outline-none"
                  >
                    <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
                  </select>
                </label>

                <label class="flex flex-col gap-2">
                  <span class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Visibilité</span>
                  <select
                    v-model="selectedVisibility"
                    class="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-primary/30 focus:bg-white focus:outline-none"
                  >
                    <option v-for="visibility in visibilityOptions" :key="visibility" :value="visibility">
                      {{ visibility }}
                    </option>
                  </select>
                </label>

                <label class="flex flex-col gap-2">
                  <span class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Trier par</span>
                  <select
                    v-model="selectedSort"
                    class="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-primary/30 focus:bg-white focus:outline-none"
                  >
                    <option value="recent">Plus récents</option>
                    <option value="alphabetical">Alphabétique</option>
                    <option value="type">Type de contenu</option>
                  </select>
                </label>
              </div>

              <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="filter in typeFilters"
                    :key="filter"
                    type="button"
                    class="inline-flex rounded-full border px-4 py-2 text-sm font-semibold transition"
                    :class="
                      selectedType === filter
                        ? 'border-primary/20 bg-primary text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    "
                    @click="selectedType = filter"
                  >
                    {{ filter }}
                  </button>
                </div>

                <div class="flex flex-wrap items-center gap-3">
                  <span class="text-sm font-medium text-slate-500">{{ resultLabel }}</span>
                  <AppButton variant="ghost" size="md" @click="resetFilters">Réinitialiser</AppButton>
                </div>
              </div>
            </div>
          </div>

          <div v-if="filteredContentItems.length" class="grid gap-5 xl:grid-cols-2">
            <article
              v-for="item in filteredContentItems"
              :key="item.id"
              class="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_26px_80px_-54px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 hover:border-primary/20"
            >
              <div class="flex flex-col gap-5">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]" :class="item.tone">
                      {{ item.type }}
                    </span>
                    <span class="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {{ item.status }}
                    </span>
                    <span class="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {{ item.visibility }}
                    </span>
                  </div>

                  <RouterLink :to="item.to" class="text-sm font-semibold text-primary transition group-hover:translate-x-0.5">
                    {{ item.actionLabel }}
                  </RouterLink>
                </div>

                <div class="flex flex-col gap-3">
                  <h2 class="text-2xl font-semibold leading-tight tracking-[-0.03em] text-slate-950">
                    {{ item.title }}
                  </h2>
                  <p class="text-sm leading-7 text-slate-600">
                    {{ item.summary }}
                  </p>
                </div>

                <div class="grid gap-3 rounded-[1.5rem] bg-slate-50 p-4 sm:grid-cols-3">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Dernière activité</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ item.updatedAt }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Audience</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ item.audience }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Signal</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ item.metric }}</p>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div
            v-else
            class="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]"
          >
            <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Aucun contenu trouvé</p>
            <h2 class="mt-3 text-2xl font-semibold text-slate-950">Ajustez la recherche ou recréez une vue plus large.</h2>
            <p class="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Aucun élément ne correspond à vos filtres actuels. Vous pouvez réinitialiser la vue ou repartir sur une
              nouvelle création.
            </p>
            <div class="mt-6 flex flex-wrap justify-center gap-3">
              <AppButton variant="secondary" size="md" @click="resetFilters">Réinitialiser les filtres</AppButton>
              <AppButton as="router-link" to="/articles" variant="primary" size="md">Ajouter un contenu</AppButton>
            </div>
          </div>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

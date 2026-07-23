<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const LAUNCH = new Date('2026-08-23T00:00:00')

const days = ref(0)
const hours = ref(0)
const minutes = ref(0)
const seconds = ref(0)
const launched = ref(false)

function tick() {
  const diff = LAUNCH.getTime() - Date.now()
  if (diff <= 0) { launched.value = true; return }
  days.value = Math.floor(diff / 86400000)
  hours.value = Math.floor((diff % 86400000) / 3600000)
  minutes.value = Math.floor((diff % 3600000) / 60000)
  seconds.value = Math.floor((diff % 60000) / 1000)
}

let timer: ReturnType<typeof setInterval>
onMounted(() => { tick(); timer = setInterval(tick, 1000) })
onUnmounted(() => clearInterval(timer))

const pad = (n: number) => String(n).padStart(2, '0')

const units = [
  { key: 'days', label: 'Jours' },
  { key: 'hours', label: 'Heures' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'seconds', label: 'Secondes' },
] as const

const counters = { days, hours, minutes, seconds }

const features = [
  {
    label: 'Articles enrichis',
    desc: 'Analyses profondes alimentées par les données, visualisations intégrées et sources vérifiées.',
    path: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
  },
  {
    label: 'Sondages',
    desc: 'Exploration et comparaison de vagues d\'opinion publique avec des visualisations claires.',
    path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    label: 'StatsData',
    desc: 'Datasets interactifs, comparaison d\'indicateurs et pages de données personnalisables.',
    path: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
  },
  {
    label: 'Chaînes éditoriales',
    desc: 'Espaces thématiques pour centraliser vos productions, abonnements et signaux.',
    path: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  },
  {
    label: 'Studio éditorial',
    desc: 'Éditeur de contenu drag & drop pour construire articles, rapports et pages de données.',
    path: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  },
  {
    label: 'Fil d\'actualité',
    desc: 'Veille automatisée, alertes sur les indicateurs clés et signaux de tendances.',
    path: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  },
]

const usecases = [
  { emoji: '✍️', title: 'Journalistes', desc: 'Accédez aux données, construisez vos analyses et publiez des articles enrichis en quelques clics.' },
  { emoji: '🏢', title: 'Rédactions & médias', desc: 'Centralisez les productions de votre équipe, créez des chaînes thématiques et suivez vos indicateurs.' },
  { emoji: '🔬', title: 'Chercheurs & analystes', desc: 'Explorez des datasets structurés, comparez des indicateurs et diffusez vos résultats.' },
]

</script>

<template>
  <div class="relative min-h-svh overflow-x-hidden bg-slate-950 font-sans text-white">

    <!-- Background grid -->
    <div
      class="pointer-events-none fixed inset-0 opacity-[0.025]"
      style="background-image: linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px); background-size: 56px 56px;"
      aria-hidden="true"
    />

    <!-- Gradient blobs -->
    <div class="pointer-events-none fixed inset-0" aria-hidden="true">
      <div class="absolute left-0 top-0 h-[700px] w-[700px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/14 blur-[130px]" />
      <div class="absolute right-0 top-1/4 h-[500px] w-[500px] translate-x-1/3 rounded-full bg-accent/10 blur-[110px]" />
      <div class="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" />
    </div>

    <div class="relative container py-8 sm:py-10 lg:py-14">

      <!-- Header -->
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="/brand/statsio-logo.svg" alt="Statsio" class="h-10 w-10 rounded-2xl bg-primary/20 p-1.5 sm:h-11 sm:w-11" />
          <div>
            <AppWordmark as="p" class="text-sm tracking-[0.3em] text-white" />
          </div>
        </div>
        <span class="badge border-white/10 bg-white/8 text-white/60">
          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Bientôt disponible
        </span>
      </header>

      <!-- Hero -->
      <section class="mx-auto mt-20 max-w-3xl text-center sm:mt-28 lg:mt-36">
        <p class="eyebrow mb-6">Ouverture le 23 août 2026</p>

        <h1 class="text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl">
          Le data journalism
          <br class="hidden sm:block" />
          <span class="text-gradient">réinventé.</span>
        </h1>

        <p class="mx-auto mt-7 max-w-xl text-base leading-8 text-slate-400 sm:text-lg sm:leading-9">
          Statsio centralise analyses, données et signaux pour les journalistes et rédactions qui veulent produire plus vite, avec plus d'impact.
        </p>

        <!-- Countdown -->
        <div class="mt-14 flex items-start justify-center gap-2 sm:gap-4">
          <template v-if="!launched">
            <template v-for="(unit, i) in units" :key="unit.key">
              <div class="flex flex-col items-center gap-2.5">
                <div class="mono flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-3xl font-bold tabular-nums text-white shadow-inner backdrop-blur-sm sm:h-24 sm:w-24 sm:text-4xl lg:text-5xl lg:h-28 lg:w-28">
                  {{ pad(counters[unit.key].value) }}
                </div>
                <span class="eyebrow text-[9px] sm:text-[10px]">{{ unit.label }}</span>
              </div>
              <span v-if="(i as number) < 3" class="mono mt-3 text-2xl font-light text-white/20 sm:mt-5 sm:text-3xl lg:mt-7">:</span>
            </template>
          </template>
          <p v-else class="text-xl font-semibold text-primary">
            Statsio est en ligne !
          </p>
        </div>

      </section>

      <!-- Divider -->
      <div class="my-24 flex items-center gap-4 lg:my-32">
        <div class="h-px flex-1 bg-white/6" />
        <img src="/brand/statsio-logo.svg" alt="" class="h-5 w-5 opacity-20" aria-hidden="true" />
        <div class="h-px flex-1 bg-white/6" />
      </div>

      <!-- Features -->
      <section>
        <div class="mb-12 text-center">
          <p class="eyebrow mb-3">La plateforme</p>
          <h2 class="text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">
            Tout ce dont vous avez besoin
          </h2>
        </div>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="f in features"
            :key="f.label"
            class="group rounded-2xl border border-white/6 bg-white/3 p-6 transition duration-300 hover:border-primary/20 hover:bg-primary/5"
          >
            <div class="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary transition duration-300 group-hover:bg-primary/20">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" :d="f.path" />
              </svg>
            </div>
            <h3 class="mb-2 font-semibold text-white">{{ f.label }}</h3>
            <p class="text-sm leading-6 text-slate-400">{{ f.desc }}</p>
          </article>
        </div>
      </section>

      <!-- Sub-brands -->
      <section class="mt-24 lg:mt-32">
        <div class="mb-12 text-center">
          <p class="eyebrow mb-3">L'écosystème</p>
          <h2 class="text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">
            Des verticales spécialisées
          </h2>
          <p class="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-400">
            Statsio est la plateforme centrale. Autour d'elle, des produits dédiés à chaque domaine de données.
          </p>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">

          <!-- TVStats -->
          <article class="group rounded-3xl border border-green-800/25 bg-green-950/20 p-8 transition duration-300 hover:border-green-700/35 hover:bg-green-950/30">
            <div class="mb-6 flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-900/50 p-2">
                <img src="/brand/tvstats/tvstats-logo.svg" alt="TVStats" class="h-8 w-8" />
              </div>
              <div>
                <p class="font-bold text-white">TVStats</p>
                <p class="text-xs text-green-400/80">L'audience TV décryptée.</p>
              </div>
            </div>
            <p class="mb-5 text-sm leading-7 text-slate-300">
              Tableaux de bord audience en temps réel, classements, tendances et signaux sur toutes les chaînes françaises.
            </p>
            <div class="flex flex-wrap gap-2">
              <span v-for="tag in ['Audiences', 'Classements', 'Tendances', 'Live']" :key="tag" class="rounded-full border border-green-700/30 bg-green-900/35 px-3 py-1 text-[11px] font-semibold text-green-400">
                {{ tag }}
              </span>
            </div>
          </article>

          <!-- MediStats -->
          <article class="group rounded-3xl border border-red-800/25 bg-red-950/20 p-8 transition duration-300 hover:border-red-700/35 hover:bg-red-950/30">
            <div class="mb-6 flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-900/50 p-2">
                <img src="/brand/medistats/medistats-logo.svg" alt="MediStats" class="h-8 w-8" />
              </div>
              <div>
                <p class="font-bold text-white">MediStats</p>
                <p class="text-xs text-red-400/80">Les données de santé, lisibles.</p>
              </div>
            </div>
            <p class="mb-5 text-sm leading-7 text-slate-300">
              Statistiques médicales et sanitaires mises en perspective : épidémiologie, hospitalisations, couverture vaccinale.
            </p>
            <div class="flex flex-wrap gap-2">
              <span v-for="tag in ['Épidémiologie', 'Hospitalisations', 'Vaccination', 'Santé publique']" :key="tag" class="rounded-full border border-red-700/30 bg-red-900/35 px-3 py-1 text-[11px] font-semibold text-red-400">
                {{ tag }}
              </span>
            </div>
          </article>

        </div>
      </section>

      <!-- Use cases -->
      <section class="mt-24 lg:mt-32">
        <div class="mb-12 text-center">
          <p class="eyebrow mb-3">Pour qui ?</p>
          <h2 class="text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">
            Conçu pour les professionnels de l'information
          </h2>
        </div>
        <div class="grid gap-4 sm:grid-cols-3">
          <div
            v-for="uc in usecases"
            :key="uc.title"
            class="rounded-2xl border border-white/6 bg-white/3 p-6 text-center"
          >
            <div class="mb-3 text-4xl">{{ uc.emoji }}</div>
            <h3 class="mb-2 font-semibold text-white">{{ uc.title }}</h3>
            <p class="text-sm leading-6 text-slate-400">{{ uc.desc }}</p>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="mt-24 border-t border-white/6 pb-6 pt-8">
        <div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div class="flex items-center gap-2.5">
            <img src="/brand/statsio-logo.svg" alt="Statsio" class="h-6 w-6 opacity-40" />
            <AppWordmark as="span" class="text-xs tracking-[0.3em] text-white/30" />
          </div>
          <p class="text-xs text-slate-600">© 2026 Statsio. Tous droits réservés.</p>
        </div>
      </footer>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const LAUNCH = new Date('2026-07-23T00:00:00')

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

const features = [
  {
    label: 'Articles enrichis',
    desc: 'Analyses profondes alimentées par les données, visualisations intégrées et sources vérifiées.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>`,
  },
  {
    label: 'Sondages',
    desc: 'Exploration et comparaison de vagues d\'opinion publique avec des visualisations claires et accessibles.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
  },
  {
    label: 'StatsData',
    desc: 'Exploration de datasets interactifs, comparaison d\'indicateurs et pages de données personnalisables.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>`,
  },
  {
    label: 'Chaînes éditoriales',
    desc: 'Espaces thématiques pour centraliser vos productions, abonnements et signaux en temps réel.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>`,
  },
  {
    label: 'Studio éditorial',
    desc: 'Éditeur de contenu drag & drop pour construire articles, rapports et pages de données enrichies.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>`,
  },
  {
    label: 'Fil d\'actualité',
    desc: 'Veille automatisée, alertes sur les indicateurs clés et signaux de tendances à surveiller.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`,
  },
]

const brands = [
  {
    name: 'TVStats',
    tagline: 'L\'audience TV décryptée.',
    desc: 'Tableaux de bord audience en temps réel, classements, tendances et signaux sur toutes les chaînes françaises.',
    border: 'border-green-700/30',
    bg: 'bg-green-950/25',
    pill: 'bg-green-900/40 text-green-400 border-green-700/30',
    icon: 'text-green-400',
    iconBg: 'bg-green-900/40',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`,
    tags: ['Audiences', 'Classements', 'Tendances', 'Chaînes'],
  },
  {
    name: 'MediStats',
    tagline: 'Les données de santé, lisibles.',
    desc: 'Statistiques médicales et sanitaires mises en perspective : épidémiologie, hospitalisations, couverture vaccinale.',
    border: 'border-red-700/30',
    bg: 'bg-red-950/25',
    pill: 'bg-red-900/40 text-red-400 border-red-700/30',
    icon: 'text-red-400',
    iconBg: 'bg-red-900/40',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>`,
    tags: ['Épidémiologie', 'Hospitalisations', 'Vaccination', 'Santé publique'],
  },
]

const email = ref('')
const notified = ref(false)

function notify() {
  if (!email.value.trim()) return
  notified.value = true
}
</script>

<template>
  <div class="min-h-svh overflow-x-hidden bg-slate-950 text-white">

    <!-- Gradient blobs -->
    <div class="pointer-events-none fixed inset-0" aria-hidden="true">
      <div class="absolute left-0 top-0 h-[700px] w-[700px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-violet-600/12 blur-[130px]" />
      <div class="absolute right-0 top-0 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/4 rounded-full bg-blue-600/10 blur-[110px]" />
      <div class="absolute bottom-0 left-1/2 h-[500px] w-[500px] -translate-x-1/2 translate-y-1/3 rounded-full bg-violet-500/8 blur-[100px]" />
    </div>

    <div class="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">

      <!-- Header -->
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <span class="text-lg font-bold tracking-tight text-white">Statsio</span>
        </div>
        <span class="inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-violet-300">
          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
          Bientôt disponible
        </span>
      </header>

      <!-- Hero -->
      <section class="mx-auto mt-20 max-w-3xl text-center sm:mt-28">
        <p class="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
          Ouverture le 23 juillet 2026
        </p>
        <h1 class="text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
          Le data journalism<br>
          <span class="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">réinventé.</span>
        </h1>
        <p class="mx-auto mt-6 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">
          Statsio centralise analyses, données et signaux pour les journalistes et rédactions qui veulent produire plus vite, avec plus d'impact.
        </p>

        <!-- Countdown -->
        <div class="mt-14 flex items-start justify-center gap-3 sm:gap-5">
          <template v-if="!launched">
            <div v-for="unit in [{ v: days, l: 'Jours' }, { v: hours, l: 'Heures' }, { v: minutes, l: 'Minutes' }, { v: seconds, l: 'Secondes' }]" :key="unit.l" class="flex flex-col items-center gap-2">
              <div class="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/5 font-mono text-3xl font-bold tabular-nums text-white backdrop-blur sm:h-20 sm:w-20 sm:text-4xl">
                {{ pad(unit.v) }}
              </div>
              <span class="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{{ unit.l }}</span>
            </div>
          </template>
          <template v-else>
            <p class="text-xl font-semibold text-violet-300">Statsio est en ligne !</p>
          </template>
        </div>

        <!-- Notify -->
        <div class="mt-10 flex flex-col items-center gap-3">
          <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
          >
            <p v-if="notified" class="font-medium text-violet-300">
              Parfait, on vous prévient dès l'ouverture !
            </p>
            <form v-else class="flex w-full max-w-sm gap-2" @submit.prevent="notify">
              <input
                v-model="email"
                type="email"
                placeholder="votre@email.fr"
                class="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/50 focus:bg-white/8 transition"
              />
              <button
                type="submit"
                class="shrink-0 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-[0.97]"
              >
                Me notifier
              </button>
            </form>
          </Transition>
          <p class="text-xs text-slate-600">Soyez parmi les premiers à accéder à la plateforme.</p>
        </div>
      </section>

      <!-- Features -->
      <section class="mt-28">
        <div class="mb-10 text-center">
          <p class="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">La plateforme</p>
          <h2 class="text-2xl font-semibold text-white sm:text-3xl">Tout ce dont vous avez besoin</h2>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="f in features"
            :key="f.label"
            class="group rounded-2xl border border-white/6 bg-white/3 p-6 transition duration-200 hover:border-white/12 hover:bg-white/6"
          >
            <div class="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary transition group-hover:bg-primary/22">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <span v-html="f.svg" />
            </div>
            <h3 class="mb-2 font-semibold text-white">{{ f.label }}</h3>
            <p class="text-sm leading-6 text-slate-400">{{ f.desc }}</p>
          </article>
        </div>
      </section>

      <!-- Sub-brands -->
      <section class="mt-24">
        <div class="mb-10 text-center">
          <p class="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">L'écosystème</p>
          <h2 class="text-2xl font-semibold text-white sm:text-3xl">Des verticales spécialisées</h2>
          <p class="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-400">
            Statsio est la plateforme centrale. Autour d'elle, des produits dédiés à chaque domaine de données.
          </p>
        </div>
        <div class="grid gap-5 sm:grid-cols-2">
          <article
            v-for="b in brands"
            :key="b.name"
            class="rounded-3xl border p-8"
            :class="[b.border, b.bg]"
          >
            <div class="mb-5 flex items-center gap-3">
              <div class="inline-flex h-10 w-10 items-center justify-center rounded-2xl" :class="b.iconBg">
                <span :class="b.icon">
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <span v-html="b.svg" />
                </span>
              </div>
              <div>
                <div class="font-bold text-white">{{ b.name }}</div>
                <div class="text-xs text-slate-400">{{ b.tagline }}</div>
              </div>
            </div>
            <p class="mb-5 text-sm leading-7 text-slate-300">{{ b.desc }}</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in b.tags"
                :key="tag"
                class="rounded-full border px-3 py-1 text-[11px] font-semibold"
                :class="b.pill"
              >{{ tag }}</span>
            </div>
          </article>
        </div>
      </section>

      <!-- Use cases -->
      <section class="mt-24">
        <div class="mb-10 text-center">
          <p class="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Pour qui ?</p>
          <h2 class="text-2xl font-semibold text-white sm:text-3xl">Conçu pour les professionnels de l'information</h2>
        </div>
        <div class="grid gap-4 sm:grid-cols-3">
          <div
            v-for="uc in [
              { title: 'Journalistes', desc: 'Accédez aux données, construisez vos analyses et publiez des articles enrichis en quelques clics.', icon: '✍️' },
              { title: 'Rédactions & médias', desc: 'Centralisez les productions de votre équipe, créez des chaînes thématiques et suivez vos indicateurs.', icon: '🏢' },
              { title: 'Chercheurs & analystes', desc: 'Explorez des datasets structurés, comparez des indicateurs et diffusez vos résultats.', icon: '🔬' },
            ]"
            :key="uc.title"
            class="rounded-2xl border border-white/6 bg-white/3 p-6 text-center"
          >
            <div class="mb-3 text-3xl">{{ uc.icon }}</div>
            <h3 class="mb-2 font-semibold text-white">{{ uc.title }}</h3>
            <p class="text-sm leading-6 text-slate-400">{{ uc.desc }}</p>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="mt-24 border-t border-white/6 pt-8 pb-4 text-center">
        <p class="text-xs text-slate-600">
          © 2026 Statsio — La plateforme de data journalism. Tous droits réservés.
        </p>
      </footer>

    </div>
  </div>
</template>

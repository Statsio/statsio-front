<script setup lang="ts">
import { computed, ref } from 'vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppPromoBanner from '@/components/layout/AppPromoBanner.vue'
import PollCard from '@/components/polls/PollCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { pollFilterLabels, pollSummaries } from '@/data/polls'
import { sharedPromoItems } from '@/data/promo-items'

const activeFilter = ref<(typeof pollFilterLabels)[number]>('Tous')

const filteredPolls = computed(() =>
  pollSummaries.filter((poll) => {
    if (activeFilter.value === 'Ouverts') {
      return poll.status === 'open'
    }

    if (activeFilter.value === 'Fermés') {
      return poll.status === 'closed'
    }

    if (activeFilter.value === 'Avec date limite') {
      return Boolean(poll.deadline)
    }

    if (activeFilter.value === 'Multi-questions') {
      return poll.questionCount > 1
    }

    return true
  }),
)

const editorialPoints = [
  {
    title: 'Réponse depuis le détail',
    detail: 'Le listing sert à comparer les vagues, pas à répondre directement.',
  },
  {
    title: 'États lisibles',
    detail: 'Un sondage peut être ouvert ou fermé, avec ou sans date limite.',
  },
  {
    title: 'Questions flexibles',
    detail: 'La structure supporte aussi bien une question unique qu’un formulaire multi-questions.',
  },
]
</script>

<template>
  <div class="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_18%,#eef4ff_100%)] text-slate-900">
    <AppPromoBanner :items="sharedPromoItems" />
    <AppHeader />

    <main class="pb-24 pt-32">
      <section class="section pb-8">
        <div class="container grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:items-start">
          <div class="flex flex-col gap-8">
            <div class="flex flex-col gap-5">
              <p class="eyebrow text-primary">Sondages & baromètres</p>
              <div class="flex max-w-4xl flex-col gap-4">
                <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                  Une page sondages pensée pour comparer les vagues et répondre au bon niveau.
                </h1>
                <p class="max-w-3xl text-lg leading-8 text-slate-600">
                  Parcourez les consultations ouvertes ou archivées, identifiez les dates limites, puis ouvrez le détail pour répondre question par question.
                </p>
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-3">
              <div class="rounded-[1.75rem] border border-slate-200 bg-white/85 px-5 py-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Vagues actives</p>
                <p class="mt-3 text-2xl font-semibold text-slate-950">
                  {{ pollSummaries.filter((poll) => poll.status === 'open').length }}
                </p>
              </div>
              <div class="rounded-[1.75rem] border border-slate-200 bg-white/85 px-5 py-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Avec échéance</p>
                <p class="mt-3 text-2xl font-semibold text-slate-950">
                  {{ pollSummaries.filter((poll) => poll.deadline).length }}
                </p>
              </div>
              <div class="rounded-[1.75rem] border border-slate-200 bg-white/85 px-5 py-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Questions totales</p>
                <p class="mt-3 text-2xl font-semibold text-slate-950">
                  {{ pollSummaries.reduce((total, poll) => total + poll.questionCount, 0) }}
                </p>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                v-for="filter in pollFilterLabels"
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

          <aside class="flex flex-col gap-4">
            <div class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Principes produit</p>
              <div class="mt-5 flex flex-col gap-4">
                <div v-for="item in editorialPoints" :key="item.title" class="rounded-[1.5rem] bg-white/8 p-4">
                  <p class="text-sm font-semibold text-white">{{ item.title }}</p>
                  <p class="mt-2 text-sm leading-6 text-slate-300">{{ item.detail }}</p>
                </div>
              </div>
            </div>

            <div class="rounded-[2rem] border border-slate-200 bg-white p-6">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Créer un sondage</p>
              <p class="mt-4 text-sm leading-7 text-slate-600">
                Le FAB et la navigation peuvent désormais pointer vers cette surface pour préparer les prochains parcours créateur.
              </p>
              <div class="mt-5">
                <AppButton as="router-link" to="/profile" variant="secondary" size="md" full-width>
                  Ouvrir l’espace créateur
                </AppButton>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section class="section pt-6">
        <div class="container">
          <div class="mb-6 flex items-center justify-between gap-4">
            <div>
              <p class="eyebrow">Catalogue</p>
              <h2 class="text-3xl font-semibold text-slate-950">Tous les sondages disponibles</h2>
            </div>
            <p class="text-sm text-slate-500">
              {{ filteredPolls.length }} sondage<span v-if="filteredPolls.length > 1">s</span>
            </p>
          </div>

          <div class="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <PollCard v-for="poll in filteredPolls" :key="poll.slug" :poll="poll" />
          </div>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

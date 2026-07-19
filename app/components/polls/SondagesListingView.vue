<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PollCard from '@/components/polls/PollCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { fetchPublicSurveys, type StatsDataDocument } from '@/api/studio'
import { isFormBlock } from '@/types/studio'

const props = defineProps<{
  categories?: string[]
}>()

const filterLabels = ['Tous', 'Question unique', 'Multi-questions'] as const
const activeFilter = ref<(typeof filterLabels)[number]>('Tous')

const loading = ref(true)
const polls = ref<StatsDataDocument[]>([])

onMounted(async () => {
  try {
    polls.value = await fetchPublicSurveys(props.categories)
  } finally {
    loading.value = false
  }
})

function questionCount(poll: StatsDataDocument) {
  return (poll.blocks ?? []).filter((block) => isFormBlock(block.type)).length
}

const totalQuestions = computed(() => polls.value.reduce((total, poll) => total + questionCount(poll), 0))
const multiQuestionCount = computed(() => polls.value.filter((poll) => questionCount(poll) > 1).length)

const filteredPolls = computed(() =>
  polls.value.filter((poll) => {
    if (activeFilter.value === 'Question unique') {
      return questionCount(poll) === 1
    }

    if (activeFilter.value === 'Multi-questions') {
      return questionCount(poll) > 1
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
    title: 'Résultats en direct',
    detail: 'Chaque réponse met à jour immédiatement les résultats agrégés du sondage.',
  },
  {
    title: 'Questions flexibles',
    detail: 'La structure supporte aussi bien une question unique qu’un formulaire multi-questions.',
  },
]
</script>

<template>
  <main class="pb-24 pt-4">
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
                Parcourez les consultations publiées par la rédaction, puis ouvrez le détail pour répondre question par question.
              </p>
            </div>
          </div>

            <div class="grid gap-4 sm:grid-cols-3">
              <div class="rounded-[1.75rem] border border-slate-200 bg-white/85 px-5 py-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Sondages publiés</p>
                <p class="mt-3 text-2xl font-semibold text-slate-950">
                  {{ polls.length }}
                </p>
              </div>
              <div class="rounded-[1.75rem] border border-slate-200 bg-white/85 px-5 py-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Questions totales</p>
                <p class="mt-3 text-2xl font-semibold text-slate-950">
                  {{ totalQuestions }}
                </p>
              </div>
              <div class="rounded-[1.75rem] border border-slate-200 bg-white/85 px-5 py-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Multi-questions</p>
                <p class="mt-3 text-2xl font-semibold text-slate-950">
                  {{ multiQuestionCount }}
                </p>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                v-for="filter in filterLabels"
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
                Le Studio permet de publier vos propres sondages et de suivre les réponses en direct.
              </p>
              <div class="mt-5">
                <AppButton as="router-link" to="/user" variant="secondary" size="md" full-width>
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
          <p v-if="!loading" class="text-sm text-slate-500">
            {{ filteredPolls.length }} sondage<span v-if="filteredPolls.length > 1">s</span>
          </p>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-24">
          <svg class="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>

        <div v-else-if="filteredPolls.length > 0" class="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <PollCard v-for="poll in filteredPolls" :key="poll.slug" :poll="poll" />
        </div>

        <div v-else class="py-20 text-center text-slate-400">
          <p class="text-sm">Aucun sondage publié pour le moment.</p>
        </div>
      </div>
    </section>
  </main>
</template>

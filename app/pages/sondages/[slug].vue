<script setup lang="ts">
definePageMeta({ layout: 'default' })
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import PollQuestionBlock from '@/components/polls/PollQuestionBlock.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { pollDetails, type PollDetail, type PollQuestion, pollSummaries } from '@/data/polls'

const route = useRoute()

const fallbackSlug = 'barometre-municipales-priorites-locales'
const fallbackPoll = pollDetails[fallbackSlug] as PollDetail

const poll = computed<PollDetail>(() => {
  const slug = String(route.params.slug ?? fallbackSlug)

  return pollDetails[slug] ?? fallbackPoll
})

const selectedAnswers = ref<Record<string, string[]>>({})
const isSubmitted = ref(false)

const canRespond = computed(() => poll.value.status === 'open')

const allQuestionsAnswered = computed(() =>
  poll.value.questions.every((question: PollQuestion) => (selectedAnswers.value[question.id] ?? []).length > 0),
)

const relatedPolls = computed(() => pollSummaries.filter((item) => item.slug !== poll.value.slug).slice(0, 2))

const resetForm = () => {
  selectedAnswers.value = Object.fromEntries(poll.value.questions.map((question: PollQuestion) => [question.id, []]))
  isSubmitted.value = false
}

const updateAnswer = (questionId: string, value: string[]) => {
  selectedAnswers.value = {
    ...selectedAnswers.value,
    [questionId]: value,
  }
}

const handleSubmit = () => {
  if (!canRespond.value || !allQuestionsAnswered.value) {
    return
  }

  isSubmitted.value = true
}

watch(
  () => poll.value.slug,
  () => {
    resetForm()
  },
  { immediate: true },
)
</script>

<template>
  <main class="pb-24 pt-4">
      <section class="section pb-10">
        <div class="container flex flex-col gap-10">
          <div class="flex flex-col gap-5">
            <div class="flex flex-wrap items-center gap-3">
              <p class="eyebrow text-primary">{{ poll.category }}</p>
              <span
                class="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                :class="poll.status === 'closed' ? 'bg-slate-900 text-white' : 'bg-emerald-100 text-emerald-700'"
              >
                {{ poll.status === 'closed' ? 'Fermé' : 'Ouvert' }}
              </span>
            </div>

            <div class="flex max-w-5xl flex-col gap-4">
              <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                {{ poll.title }}
              </h1>
              <p class="max-w-3xl text-lg leading-8 text-slate-600">
                {{ poll.intro }}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
              <span>{{ poll.author }}</span>
              <span>{{ poll.publishedAt }}</span>
              <span>{{ poll.estimatedTime }}</span>
              <span v-if="poll.deadline">Réponse jusqu’au {{ poll.deadline }}</span>
              <span v-else>Sans date limite</span>
            </div>
          </div>

          <div
            v-if="poll.coverImage"
            class="overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-[0_36px_110px_-62px_rgba(15,23,42,0.45)]"
          >
            <img :src="poll.coverImage" :alt="poll.title" class="h-[280px] w-full object-cover sm:h-[360px] lg:h-[420px]" />
          </div>

          <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div class="flex flex-col gap-6">
              <div
                v-if="isSubmitted"
                class="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 px-6 py-5 text-emerald-800"
              >
                <p class="text-sm font-semibold uppercase tracking-[0.18em]">Réponse enregistrée</p>
                <p class="mt-2 text-sm leading-6">
                  Votre participation a bien été prise en compte pour cette maquette. Les sélections restent visibles tant que vous restez sur la page.
                </p>
              </div>

              <div
                v-else-if="!canRespond"
                class="rounded-[1.75rem] border border-slate-200 bg-slate-100 px-6 py-5 text-slate-700"
              >
                <p class="text-sm font-semibold uppercase tracking-[0.18em]">Sondage fermé</p>
                <p class="mt-2 text-sm leading-6">
                  Ce sondage n’accepte plus de réponses. La structure du questionnaire reste consultable à titre de référence.
                </p>
              </div>

              <PollQuestionBlock
                v-for="question in poll.questions"
                :key="question.id"
                :question="question"
                :model-value="selectedAnswers[question.id] ?? []"
                :disabled="!canRespond || isSubmitted"
                @update:model-value="updateAnswer(question.id, $event)"
              />

              <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.35)]">
                <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Validation</p>
                    <p class="mt-2 text-sm leading-6 text-slate-600">
                      {{ canRespond ? 'Toutes les questions doivent être complétées avant envoi.' : 'Le formulaire est verrouillé pour cette vague.' }}
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-3">
                    <AppButton as="router-link" to="/sondages" variant="secondary" size="md">
                      Retour au listing
                    </AppButton>
                    <AppButton
                      variant="primary"
                      size="md"
                      :disabled="!canRespond || isSubmitted || !allQuestionsAnswered"
                      @click="handleSubmit"
                    >
                      {{ isSubmitted ? 'Déjà envoyé' : 'Envoyer mes réponses' }}
                    </AppButton>
                  </div>
                </div>
              </div>
            </div>

            <aside class="flex flex-col gap-5">
              <div class="rounded-[2rem] border border-slate-200 bg-white p-6">
                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div class="rounded-[1.5rem] bg-slate-50 px-4 py-4">
                    <p class="text-[11px] uppercase tracking-[0.16em] text-slate-400">Réponses</p>
                    <p class="mt-2 text-2xl font-semibold text-slate-950">{{ poll.responseCount }}</p>
                  </div>
                  <div class="rounded-[1.5rem] bg-slate-50 px-4 py-4">
                    <p class="text-[11px] uppercase tracking-[0.16em] text-slate-400">Questions</p>
                    <p class="mt-2 text-2xl font-semibold text-slate-950">{{ poll.questionCount }}</p>
                  </div>
                </div>
              </div>

              <div class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">À retenir</p>
                <ul class="mt-5 flex flex-col gap-3 text-sm leading-7 text-slate-300">
                  <li v-for="highlight in poll.highlights" :key="highlight" class="flex items-start gap-3">
                    <span class="mt-2 h-2 w-2 rounded-full bg-primary"></span>
                    <span>{{ highlight }}</span>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section class="section pt-0">
        <div class="container flex flex-col gap-8">
          <div class="flex flex-col gap-2">
            <p class="eyebrow">À consulter aussi</p>
            <h2 class="text-3xl font-semibold text-slate-950">Autres sondages</h2>
          </div>

          <div class="grid gap-6 lg:grid-cols-2">
            <RouterLink
              v-for="item in relatedPolls"
              :key="item.slug"
              :to="`/sondages/${item.slug}`"
              class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 hover:border-primary/30"
            >
              <div class="flex flex-col gap-4">
                <span class="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                  {{ item.category }}
                </span>
                <h3 class="text-2xl font-semibold leading-tight tracking-[-0.03em] text-slate-950">
                  {{ item.title }}
                </h3>
                <span class="text-sm font-semibold text-primary">
                  {{ item.status === 'closed' ? 'Voir le détail' : 'Voir et répondre' }}
                </span>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>
  </main>
</template>

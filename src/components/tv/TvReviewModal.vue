<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { fetchReviewQuestions, submitBroadcastReview, type ReviewQuestion, type ReviewsResponse } from '@/api/tv-broadcast'

const props = defineProps<{
  broadcastId: number
  programTitle: string
}>()

const emit = defineEmits<{
  close: []
  submitted: [reviews: ReviewsResponse]
}>()

const questions = ref<ReviewQuestion[]>([])
const scores = ref<Record<number, number>>({})
const comment = ref('')
const globalRating = ref<number | null>(null)
const loading = ref(true)
const submitting = ref(false)

onMounted(async () => {
  questions.value = await fetchReviewQuestions(props.broadcastId)
  loading.value = false
})

const canSubmit = computed(() =>
  globalRating.value !== null || Object.keys(scores.value).length > 0 || comment.value.trim().length > 0,
)

function setScore(questionId: number, score: number) {
  if (scores.value[questionId] === score) {
    delete scores.value[questionId]
  } else {
    scores.value[questionId] = score
  }
}

function setGlobalRating(v: number) {
  globalRating.value = globalRating.value === v ? null : v
}

async function submit() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  try {
    const scoreList = Object.entries(scores.value).map(([qid, score]) => ({
      question_id: Number(qid),
      score,
    }))
    const res = await submitBroadcastReview(props.broadcastId, {
      rating: globalRating.value,
      comment: comment.value.trim() || undefined,
      scores: scoreList,
    })
    emit('submitted', res)
  } finally {
    submitting.value = false
  }
}

const STAR_LABELS: Record<number, string> = { 1: 'Très mauvais', 2: 'Mauvais', 3: 'Moyen', 4: 'Bien', 5: 'Excellent' }
</script>

<template>
  <!-- Backdrop -->
  <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6">
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="emit('close')" />

    <div class="relative z-10 w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-tvstats-primary">Votre avis</p>
          <h2 class="mt-0.5 text-base font-bold text-slate-900 leading-tight">{{ programTitle }}</h2>
        </div>
        <button class="shrink-0 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" @click="emit('close')">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6">

        <!-- Global rating -->
        <div>
          <label class="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Note globale</label>
          <div class="flex items-center gap-1.5">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              class="rounded-full p-1 transition"
              :title="STAR_LABELS[star]"
              @click="setGlobalRating(star)"
            >
              <svg
                class="h-7 w-7 transition-colors"
                :class="(globalRating ?? 0) >= star ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
            <span v-if="globalRating" class="ml-1 text-sm font-medium text-amber-600">{{ STAR_LABELS[globalRating] }}</span>
          </div>
        </div>

        <!-- Questions -->
        <div v-if="loading" class="py-4 text-center text-sm text-slate-400">Chargement des questions…</div>
        <div v-else-if="questions.length > 0" class="space-y-4">
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Questions</label>
          <div v-for="q in questions" :key="q.id" class="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p class="text-sm font-medium text-slate-800">{{ q.label }}</p>
            <p v-if="q.description" class="mt-0.5 text-xs text-slate-500">{{ q.description }}</p>
            <div class="mt-2.5 flex items-center gap-1">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                class="rounded-full p-0.5 transition"
                @click="setScore(q.id, star)"
              >
                <svg
                  class="h-6 w-6 transition-colors"
                  :class="(scores[q.id] ?? 0) >= star ? 'fill-tvstats-primary text-tvstats-primary' : 'fill-slate-200 text-slate-200'"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
              <span v-if="scores[q.id]" class="ml-1 text-xs font-medium text-tvstats-primary">{{ scores[q.id] }}/5</span>
            </div>
          </div>
        </div>

        <!-- Comment -->
        <div>
          <label class="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Commentaire <span class="normal-case font-normal text-slate-400">(facultatif)</span>
          </label>
          <textarea
            v-model="comment"
            rows="3"
            maxlength="1000"
            placeholder="Partagez votre expérience…"
            class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-tvstats-primary resize-none"
          />
          <p class="mt-1 text-right text-xs text-slate-400">{{ comment.length }}/1000</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
        <button class="text-sm text-slate-500 hover:text-slate-700" @click="emit('close')">Passer</button>
        <button
          class="rounded-xl bg-tvstats-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-tvstats-dark disabled:opacity-50 transition"
          :disabled="!canSubmit || submitting"
          @click="submit"
        >
          {{ submitting ? 'Envoi…' : 'Publier mon avis' }}
        </button>
      </div>
    </div>
  </div>
</template>

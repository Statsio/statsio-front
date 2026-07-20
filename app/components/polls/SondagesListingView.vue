<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PollFeatureCard from '@/components/polls/PollFeatureCard.vue'
import PollListRow from '@/components/polls/PollListRow.vue'
import { fetchPublicSurveys } from '@/api/studio'
import { useRespondentToken } from '@/composables/useRespondentToken'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { enrichPoll, type EnrichedPoll } from '@/lib/poll-enrich'
import { relativeUpdate } from '@/utils/statsDataFormat'

const props = defineProps<{
  categories?: string[]
}>()

const basePath = useContentBasePath()
const token = useRespondentToken()

const loading = ref(true)
const polls = ref<EnrichedPoll[]>([])
const search = ref('')
const sort = ref<'votes' | 'recent'>('votes')
const activeCategory = ref('Tous')

onMounted(async () => {
  try {
    const raw = await fetchPublicSurveys(props.categories)
    polls.value = await Promise.all(raw.map((poll) => enrichPoll(poll, basePath.value, token.value)))
  } finally {
    loading.value = false
  }
})

const categoryTabs = computed(() => ['Tous', ...new Set(polls.value.map((p) => p.category))])

const searchedPolls = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return polls.value
  return polls.value.filter(
    (p) => p.poll.title.toLowerCase().includes(q) || (p.poll.description ?? '').toLowerCase().includes(q),
  )
})

const filteredPolls = computed(() => {
  const byCategory =
    activeCategory.value === 'Tous'
      ? searchedPolls.value
      : searchedPolls.value.filter((p) => p.category === activeCategory.value)

  return [...byCategory].sort((a, b) =>
    sort.value === 'votes'
      ? b.totalVotes - a.totalVotes
      : new Date(b.poll.created_at ?? 0).getTime() - new Date(a.poll.created_at ?? 0).getTime(),
  )
})

const heroPoll = computed(() => filteredPolls.value[0])
const mediumPolls = computed(() => filteredPolls.value.slice(1, 4))
const remainingPolls = computed(() =>
  filteredPolls.value.slice(4).sort((a, b) => {
    if (a.status.closed !== b.status.closed) return a.status.closed ? 1 : -1
    const aDeadline = a.poll.response_deadline ? new Date(a.poll.response_deadline).getTime() : Infinity
    const bDeadline = b.poll.response_deadline ? new Date(b.poll.response_deadline).getTime() : Infinity
    if (aDeadline !== bDeadline) return aDeadline - bDeadline
    return new Date(b.poll.created_at ?? 0).getTime() - new Date(a.poll.created_at ?? 0).getTime()
  }),
)

const hasUpcomingDeadline = computed(() => filteredPolls.value.some((p) => p.poll.response_deadline && !p.status.closed))
const totalVotesCollected = computed(() => polls.value.reduce((sum, p) => sum + p.totalVotes, 0))
const mostRecentUpdate = computed(() =>
  polls.value.reduce<string | undefined>((latest, p) => {
    if (!p.poll.updated_at) return latest
    if (!latest || new Date(p.poll.updated_at) > new Date(latest)) return p.poll.updated_at
    return latest
  }, undefined),
)
</script>

<template>
  <main class="pb-24 pt-4">
    <section class="section pb-10">
      <div class="container flex flex-col gap-6">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold tracking-[-0.03em] text-slate-950">Sondages</h1>
            <p class="mt-1.5 text-[13px] text-slate-500">
              {{ filteredPolls.length }} sondage<span v-if="filteredPolls.length > 1">s</span>
              <template v-if="mostRecentUpdate"> · {{ relativeUpdate(mostRecentUpdate) }}</template>
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-4">
            <input
              v-model="search"
              type="search"
              placeholder="Rechercher un sondage…"
              class="w-56 border-b border-slate-300 bg-transparent py-1 text-sm text-slate-600 placeholder:text-slate-400 focus:border-primary focus:outline-none"
            />
            <div class="h-4 w-px bg-slate-200" />
            <select v-model="sort" class="bg-transparent text-sm font-semibold text-slate-950 focus:outline-none">
              <option value="votes">Les plus votés</option>
              <option value="recent">Plus récents</option>
            </select>
          </div>
        </div>

        <div class="flex flex-wrap gap-6 border-b border-slate-100">
          <button
            v-for="cat in categoryTabs"
            :key="cat"
            type="button"
            class="border-b-2 pb-3 text-[13.5px] font-bold transition-colors"
            :class="activeCategory === cat ? 'border-primary text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-700'"
            @click="activeCategory = cat"
          >
            {{ cat }}
          </button>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-24">
          <svg class="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>

        <template v-else-if="filteredPolls.length > 0">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[220px]">
            <div v-if="heroPoll" class="sm:col-span-2 sm:row-span-2">
              <PollFeatureCard
                size="hero"
                :to="heroPoll.to"
                :category="heroPoll.category"
                :question-type="heroPoll.questionType"
                :question="heroPoll.poll.title"
                :status="heroPoll.status"
                :options="heroPoll.options"
                :total-votes="heroPoll.totalVotes"
              />
            </div>

            <PollFeatureCard
              v-for="p in mediumPolls"
              :key="p.poll.id"
              size="medium"
              :to="p.to"
              :category="p.category"
              :question-type="p.questionType"
              :question="p.poll.title"
              :status="p.status"
              :options="p.options"
              :total-votes="p.totalVotes"
            />

            <div class="flex flex-col justify-between rounded-2xl border border-slate-200 p-5">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wide text-primary">En chiffres</span>
                <p class="mt-2 font-mono text-[28px] font-bold text-slate-950">{{ totalVotesCollected }}</p>
                <p class="mt-1 text-[12.5px] text-slate-500">réponses collectées au total</p>
              </div>
              <p class="text-[12.5px] text-slate-400">
                {{ polls.length }} sondage<span v-if="polls.length > 1">s</span> publiés
              </p>
            </div>
          </div>

          <div v-if="remainingPolls.length > 0" class="flex flex-col">
            <div class="mb-4 flex items-baseline justify-between">
              <span class="text-[15px] font-bold text-slate-950">
                {{ hasUpcomingDeadline ? 'Se terminent bientôt' : 'Plus de sondages' }}
              </span>
            </div>
            <PollListRow
              v-for="p in remainingPolls"
              :key="p.poll.id"
              :to="p.to"
              :category="p.category"
              :question-type="p.questionType"
              :question="p.poll.title"
              :status="p.status"
              :options="p.options"
              :total-votes="p.totalVotes"
            />
          </div>
        </template>

        <div v-else class="py-20 text-center text-slate-400">
          <p class="text-sm">Aucun sondage dans cette catégorie pour le moment.</p>
        </div>
      </div>
    </section>
  </main>
</template>

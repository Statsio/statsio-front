<script setup lang="ts">
import { computed } from 'vue'
import type { PollSummary } from '@/data/polls'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{
  poll: PollSummary
}>()

const statusLabel = computed(() => (props.poll.status === 'closed' ? 'Fermé' : 'Ouvert'))
const statusClass = computed(() =>
  props.poll.status === 'closed' ? 'bg-slate-900 text-white' : 'bg-emerald-100 text-emerald-700',
)
</script>

<template>
  <article
    class="flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_26px_80px_-54px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 hover:border-primary/25"
  >
    <div v-if="poll.coverImage" class="overflow-hidden border-b border-slate-100 bg-slate-100">
      <img :src="poll.coverImage" :alt="poll.title" class="h-52 w-full object-cover" />
    </div>

    <div class="flex flex-1 flex-col gap-5 p-6">
      <div class="flex items-start justify-between gap-4">
        <span
          class="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600"
        >
          {{ poll.category }}
        </span>
        <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]" :class="statusClass">
          {{ statusLabel }}
        </span>
      </div>

      <div class="flex flex-1 flex-col gap-3">
        <h2 class="text-2xl font-semibold leading-tight tracking-[-0.03em] text-slate-950">
          {{ poll.title }}
        </h2>
        <p class="text-sm leading-7 text-slate-600">
          {{ poll.summary }}
        </p>
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-[1.25rem] bg-slate-50 px-4 py-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-slate-400">Réponses</p>
          <p class="mt-2 text-lg font-semibold text-slate-950">{{ poll.responseCount }}</p>
        </div>
        <div class="rounded-[1.25rem] bg-slate-50 px-4 py-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-slate-400">Questions</p>
          <p class="mt-2 text-lg font-semibold text-slate-950">{{ poll.questionCount }}</p>
        </div>
        <div class="rounded-[1.25rem] bg-slate-50 px-4 py-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-slate-400">Audience</p>
          <p class="mt-2 text-sm font-semibold text-slate-950">{{ poll.audience }}</p>
        </div>
      </div>

      <div class="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
        <p class="text-[11px] uppercase tracking-[0.18em] text-slate-400">Participation</p>
        <p class="mt-2 text-sm leading-6 text-slate-600">
          <span v-if="poll.deadline">Date limite: {{ poll.deadline }}</span>
          <span v-else>Aucune date limite renseignée pour cette vague.</span>
        </p>
      </div>

      <AppButton
        as="router-link"
        :to="`/sondages/${poll.slug}`"
        :variant="poll.status === 'closed' ? 'secondary' : 'primary'"
        size="md"
        full-width
      >
        {{ poll.status === 'closed' ? 'Voir le détail' : 'Voir et répondre' }}
      </AppButton>
    </div>
  </article>
</template>

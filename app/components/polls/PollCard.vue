<script setup lang="ts">
import { computed } from 'vue'
import type { StatsDataDocument } from '@/api/studio'
import { isFormBlock } from '@/types/studio'
import { publicContentPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{
  poll: StatsDataDocument
}>()

const basePath = useContentBasePath()
const detailPath = computed(() => publicContentPath('survey', props.poll.slug ?? '', basePath.value))

const questionCount = computed(
  () => (props.poll.blocks ?? []).filter((block) => isFormBlock(block.type)).length,
)

const category = computed(() => {
  const first = props.poll.categories?.[0]
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : 'Sondage'
})

function formatDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <article
    class="flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_26px_80px_-54px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 hover:border-primary/25"
  >
    <div class="flex flex-1 flex-col gap-5 p-6">
      <div class="flex items-start justify-between gap-4">
        <span class="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
          {{ category }}
        </span>
        <span class="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Ouvert
        </span>
      </div>

      <div class="flex flex-1 flex-col gap-3">
        <h2 class="text-2xl font-semibold leading-tight tracking-[-0.03em] text-slate-950">
          {{ poll.title }}
        </h2>
        <p v-if="poll.description" class="text-sm leading-7 text-slate-600">
          {{ poll.description }}
        </p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-[1.25rem] bg-slate-50 px-4 py-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-slate-400">Questions</p>
          <p class="mt-2 text-lg font-semibold text-slate-950">{{ questionCount }}</p>
        </div>
        <div class="rounded-[1.25rem] bg-slate-50 px-4 py-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-slate-400">Auteur</p>
          <p class="mt-2 truncate text-sm font-semibold text-slate-950">{{ poll.author?.name ?? 'Anonyme' }}</p>
        </div>
      </div>

      <div v-if="formatDate(poll.updated_at)" class="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
        <p class="text-[11px] uppercase tracking-[0.18em] text-slate-400">Mise à jour</p>
        <p class="mt-2 text-sm leading-6 text-slate-600">{{ formatDate(poll.updated_at) }}</p>
      </div>

      <AppButton as="router-link" :to="detailPath" variant="primary" size="md" full-width>
        Voir et répondre
      </AppButton>
    </div>
  </article>
</template>

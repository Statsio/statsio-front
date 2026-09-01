<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem } from '@/types/catalog'
import { catalogThemeStyle } from '@/lib/catalog-theme'
import { publicContentPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { formatRelativePublished } from '@/lib/catalog-format'
import { surveyCardMeta } from '@/lib/survey-card'
import CatalogFavButton from '@/components/listing/CatalogFavButton.vue'
import CatalogPublisherRow from '@/components/listing/CatalogPublisherRow.vue'
import CatalogSubBrandTag from '@/components/listing/CatalogSubBrandTag.vue'

const props = defineProps<{
  item: CatalogItem
  favorited: boolean
}>()

const emit = defineEmits<{
  favorite: []
  'select-tag': [string]
}>()

const basePath = useContentBasePath()
const to = computed(() => publicContentPath('survey', props.item.slug, basePath.value))
const theme = computed(() => catalogThemeStyle(props.item.category))
const meta = computed(() => surveyCardMeta(props.item))
const previewPreview = computed(() => props.item.question_previews?.[0] ?? null)
</script>

<template>
  <article
    class="flex flex-col rounded-[18px] border-[1.5px] border-slate-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(20,20,30,0.06)] transition hover:-translate-y-0.5 hover:border-[#c4b5fd]"
    :style="{ borderTop: `4px solid ${meta.kind.accent}` }"
  >
    <div class="mb-3 flex items-center gap-2">
      <span
        class="flex items-center gap-1.5 rounded-[5px] px-2 py-1 font-mono text-[9.5px] font-semibold tracking-[0.08em]"
        :style="{ color: meta.kind.fg, background: meta.kind.bg }"
      >
        <span>{{ meta.kind.icon }}</span>{{ meta.kind.label.toUpperCase() }}
      </span>
      <span class="flex items-center gap-1.5 font-mono text-[9.5px] font-semibold tracking-[0.07em]" :style="{ color: meta.statusFg }">
        <span class="h-[5px] w-[5px] rounded-full" :style="{ background: meta.statusDot }" />{{ meta.statusLabel }}
      </span>
      <span
        v-if="item.requires_identity_verification"
        class="flex items-center gap-1 font-mono text-[9px] font-semibold tracking-[0.06em] text-slate-500"
        title="Vérification d'identité requise"
      >🔒 IDENTITÉ</span>
      <span class="flex-1" />
      <CatalogFavButton :active="favorited" @toggle="emit('favorite')" />
    </div>

    <div v-if="item.category" class="mb-2 font-mono text-[9.5px] font-semibold tracking-[0.07em]" :style="{ color: theme.fg }">
      {{ item.category.toUpperCase() }}
    </div>
    <CatalogSubBrandTag :categories="item.categories" content-type="survey" />
    <NuxtLink :to="to" class="block text-[17px] font-extrabold leading-tight tracking-[-0.015em] text-pretty text-slate-950 hover:text-primary">
      {{ item.title }}
    </NuxtLink>

    <!-- Sondage rapide : barres d'options (lecture seule) -->
    <div v-if="item.survey_kind === 'single_question' && meta.options.length" class="my-3.5 flex flex-col gap-2">
      <NuxtLink
        v-for="o in meta.options"
        :key="o.label"
        :to="to"
        class="relative block overflow-hidden rounded-[10px] border-[1.5px] border-slate-200/80 bg-[#f7f6fb] px-3 py-2.5"
      >
        <span class="absolute inset-y-0 left-0 opacity-30" :style="{ width: `${o.pct}%`, background: o.color }" />
        <span class="relative flex items-center gap-2.5">
          <span class="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-slate-700">{{ o.label }}</span>
          <span class="font-mono text-[11.5px] font-semibold" :class="o.lead ? 'text-primary' : 'text-slate-500'">{{ o.pct }} %</span>
        </span>
      </NuxtLink>
      <p v-if="meta.hasMoreOptions" class="pl-0.5 font-mono text-[10.5px] text-slate-400">{{ meta.moreOptionsLabel }}</p>
    </div>

    <!-- Questionnaire : questions + aperçu -->
    <div v-else-if="item.survey_kind === 'long'" class="my-3 rounded-[13px] bg-[#faf9fd] p-3">
      <div class="flex items-center gap-2">
        <span class="font-mono text-[13px] font-semibold tracking-[-0.01em] text-slate-950">{{ item.questions_count ?? 0 }} questions</span>
        <span class="min-w-0 truncate font-mono text-[10.5px] text-slate-500">≈ {{ item.estimated_minutes ?? 1 }} min · {{ meta.participationLabel }}</span>
        <span class="flex-1" />
        <span
          v-for="q in meta.questionTypeIcons"
          :key="q.label"
          :title="q.label"
          class="flex h-[22px] w-[22px] items-center justify-center rounded-md border border-slate-200 bg-white text-[11px] text-slate-500"
        >{{ q.icon }}</span>
      </div>
      <div v-if="previewPreview" class="mt-2.5 border-t border-slate-200/70 pt-2.5">
        <p class="line-clamp-2 text-[12px] font-bold leading-snug text-slate-800">{{ previewPreview.label }}</p>
        <div class="mt-1.5 flex flex-col gap-1">
          <div
            v-for="r in previewPreview.rows.slice(0, 3)"
            :key="r.label"
            class="grid grid-cols-[92px_1fr_36px] items-center gap-2"
          >
            <span class="truncate text-[10.5px] font-semibold text-slate-600">{{ r.label }}</span>
            <span class="h-2 overflow-hidden rounded bg-[#eeebf6]">
              <span class="block h-full rounded" :style="{ width: `${r.pct}%`, background: 'var(--color-primary)' }" />
            </span>
            <span class="text-right font-mono text-[10.5px] text-slate-500">{{ r.pct }} %</span>
          </div>
        </div>
      </div>
      <NuxtLink
        :to="to"
        class="mt-3 block rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] px-4 py-2.5 text-center text-[12px] font-extrabold tracking-[0.03em] text-white"
      >
        {{ meta.status.closed ? 'VOIR LES RÉSULTATS' : 'RÉPONDRE AU QUESTIONNAIRE' }}
      </NuxtLink>
    </div>

    <!-- Pétition : jauge d'objectif -->
    <div v-else-if="item.survey_kind === 'petition'" class="my-3.5 rounded-[13px] bg-[#fdf7f9] p-3.5">
      <div class="flex items-baseline justify-between gap-2.5">
        <span class="font-mono text-[20px] font-semibold tracking-[-0.02em] text-[#be123c]">{{ meta.participationLabel }}</span>
        <span v-if="meta.goalLabel" class="font-mono text-[11px] text-slate-500">{{ meta.goalLabel }}</span>
      </div>
      <div v-if="meta.goalPct !== null" class="mt-2.5 h-[9px] overflow-hidden rounded-md bg-[#f7dde4]">
        <div class="h-full rounded-md" :style="{ width: `${meta.goalPct}%`, background: 'linear-gradient(90deg,#e11d48,#8b5cf6)' }" />
      </div>
      <p v-if="meta.goalPct !== null" class="mt-2 font-mono text-[10.5px] text-slate-500">{{ meta.goalPct }} % atteint</p>
      <p v-if="item.petition_target" class="mt-2.5 text-[12.5px] leading-relaxed text-slate-500">{{ item.petition_target }}</p>
      <NuxtLink
        :to="to"
        class="mt-3 block rounded-full px-4 py-2.5 text-center text-[12.5px] font-extrabold tracking-[0.03em]"
        :class="meta.status.closed ? 'bg-[#f4f3f8] text-slate-500' : 'bg-[#e11d48] text-white'"
      >
        {{ meta.status.closed ? 'PÉTITION CLOSE' : 'SIGNER LA PÉTITION' }}
      </NuxtLink>
    </div>

    <!-- Panneau participation (sondage rapide) -->
    <div
      v-if="item.survey_kind === 'single_question'"
      class="mb-3.5 flex items-center gap-3 rounded-[11px] bg-[#faf9fd] px-3 py-2.5"
    >
      <div class="min-w-0 flex-1">
        <div class="text-[9px] font-extrabold uppercase tracking-[0.08em] text-slate-400">Participation</div>
        <div class="mt-0.5 font-mono text-[15px] font-semibold text-slate-950">{{ meta.participationLabel }}</div>
      </div>
      <div class="min-w-0 flex-1 text-right">
        <div class="text-[9px] font-extrabold uppercase tracking-[0.08em] text-slate-400">Clôture</div>
        <div class="mt-0.5 font-mono text-[12.5px] font-semibold" :style="{ color: meta.timeFg }">{{ meta.timeLabel }}</div>
      </div>
    </div>

    <div class="flex-1" />
    <CatalogPublisherRow
      :publisher="item.publisher"
      :meta="`Mis à jour ${formatRelativePublished(item.updated_at)}`"
      :to="to"
    />
  </article>
</template>

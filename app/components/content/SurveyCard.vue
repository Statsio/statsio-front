<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem } from '@/types/catalog'
import type { ContentCardFormat, ContentCardMode, ContentCardTone, ContentManageMeta } from '@/types/content-card'
import { catalogThemeStyle } from '@/lib/catalog-theme'
import { publicContentPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { formatRelativePublished } from '@/lib/catalog-format'
import { surveyCardMeta } from '@/lib/survey-card'
import ContentCardFavButton from '@/components/content/ContentCardFavButton.vue'
import ContentCardOwner from '@/components/content/ContentCardOwner.vue'
import ContentCardActions from '@/components/content/ContentCardActions.vue'
import CatalogSubBrandTag from '@/components/listing/CatalogSubBrandTag.vue'
import ContentCardDossierTag from '@/components/content/ContentCardDossierTag.vue'
import ContentFeaturedBadge from '@/components/content/ContentFeaturedBadge.vue'

const props = withDefaults(
  defineProps<{
    item: CatalogItem
    format?: ContentCardFormat
    mode?: ContentCardMode
    favorited?: boolean
    manage?: ContentManageMeta
    tone?: ContentCardTone
    feature?: boolean
    basePath?: string
  }>(),
  { format: 'card', mode: 'public', favorited: false, feature: false, tone: 'light' },
)

const emit = defineEmits<{
  favorite: []
  edit: []
  remove: [string]
}>()

const injectedBase = useContentBasePath()
const base = computed(() => props.basePath ?? injectedBase.value)
const to = computed(() => publicContentPath('survey', props.item.slug, base.value))
const theme = computed(() => catalogThemeStyle(props.item.category))
const meta = computed(() => surveyCardMeta(props.item))
const previewPreview = computed(() => props.item.question_previews?.[0] ?? null)
const isManage = computed(() => props.mode === 'manage' && !!props.manage)
const dark = computed(() => props.tone === 'dark')
/** Contenu « à la une » (admin) hors grande card featured → pastille « À LA UNE ». */
const pinned = computed(() => Boolean(props.item.is_featured) && !props.feature)

const leadLine = computed(() => {
  const it = props.item
  if (it.survey_kind === 'long') return `${it.questions_count ?? 0} questions · ≈ ${it.estimated_minutes ?? 1} min`
  if (it.survey_kind === 'petition') return meta.value.goalLabel || meta.value.participationLabel
  const top = meta.value.options[0]
  return top ? `${top.label} — ${top.pct} %` : meta.value.participationLabel
})

const featuredStats = computed(() => {
  const it = props.item
  const rows: { label: string; value: string }[] = [
    { label: 'Participation', value: meta.value.participationLabel },
    {
      label: it.survey_kind === 'petition' ? 'Objectif' : 'Clôture',
      value: it.survey_kind === 'petition' ? meta.value.goalLabel.replace('objectif ', '') || '—' : meta.value.timeLabel,
    },
  ]
  if (meta.value.options[0]) rows.push({ label: 'Réponse en tête', value: `${meta.value.options[0].pct} %` })
  return rows
})
</script>

<template>
  <NuxtLink
    v-if="feature"
    :to="to"
    class="u-card grid gap-8 overflow-hidden rounded-[22px] px-8 py-8 shadow-[0_1px_3px_rgba(20,20,30,0.06)] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center"
    :class="dark ? 'bg-[linear-gradient(135deg,#18181f,#2c2440)] text-white' : 'border-[1.5px] border-slate-200/80 bg-white text-slate-950'"
  >
    <span class="block min-w-0">
      <span class="mb-4 flex flex-wrap items-center gap-2.5">
        <span
          class="rounded-[5px] px-2 py-1 font-mono text-[9.5px] font-semibold tracking-[0.1em]"
          :class="dark ? 'bg-[#c4b5fd] text-slate-950' : 'bg-slate-950 text-white'"
        >
          À LA UNE · {{ meta.kind.label.toUpperCase() }}
        </span>
        <span
          class="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.08em]"
          :style="{ color: meta.status.closed ? (dark ? 'rgba(255,255,255,0.6)' : 'rgba(24,24,31,0.5)') : (dark ? '#6ee7b7' : '#047857') }"
        >
          <span class="h-1.5 w-1.5 rounded-full" :style="{ background: meta.status.closed ? (dark ? 'rgba(255,255,255,0.4)' : 'rgba(24,24,31,0.3)') : '#34d399' }" />
          {{ meta.statusLabel }}<template v-if="!meta.status.closed"> · {{ meta.status.label.toUpperCase() }}</template>
        </span>
      </span>
      <span class="u-card-title block text-[1.7rem] font-extrabold leading-[1.16] tracking-[-0.025em] text-pretty lg:text-[29px]">{{ item.title }}</span>
      <span
        v-if="item.description"
        class="mt-3 block max-w-[50ch] text-[14.5px] leading-[1.6]"
        :class="dark ? 'text-white/70' : 'text-slate-500'"
      >{{ item.description }}</span>
      <span class="mt-5 flex flex-wrap gap-6">
        <span v-for="s in featuredStats" :key="s.label" class="block">
          <span class="block text-[9px] font-extrabold uppercase tracking-[0.08em]" :class="dark ? 'text-white/50' : 'text-slate-400'">{{ s.label }}</span>
          <span class="mt-1 block font-mono text-[15px] font-semibold">{{ s.value }}</span>
        </span>
      </span>
      <span class="mt-6 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] px-[22px] py-3 text-[13px] font-extrabold tracking-[0.03em] text-white">
        {{ item.survey_kind === 'petition' ? 'SIGNER LA PÉTITION' : 'PARTICIPER' }} →
      </span>
    </span>

    <span
      class="block min-w-0 rounded-2xl border p-5"
      :class="dark ? 'border-white/15 bg-white/5' : 'border-slate-200/80 bg-[#faf9fd]'"
    >
      <span class="mb-3.5 block text-[10px] font-extrabold uppercase tracking-[0.09em]" :class="dark ? 'text-white/55' : 'text-slate-400'">
        {{ item.survey_kind === 'petition' ? 'Progression' : 'Résultats en direct' }}
      </span>
      <span v-if="meta.options.length" class="flex flex-col gap-2.5">
        <span
          v-for="o in meta.options"
          :key="o.label"
          class="relative block overflow-hidden rounded-[11px] border-[1.5px] px-3.5 py-3"
          :class="dark ? 'border-white/15 bg-white/5' : 'border-slate-200/80 bg-white'"
        >
          <span class="absolute inset-y-0 left-0 opacity-40" :style="{ width: `${o.pct}%`, background: o.color }" />
          <span class="relative flex items-center gap-2.5">
            <span class="min-w-0 flex-1 truncate text-[13.5px] font-bold">{{ o.label }}</span>
            <span class="font-mono text-[12.5px] font-semibold" :class="dark ? 'text-white/85' : 'text-slate-600'">{{ o.pct }} %</span>
          </span>
        </span>
      </span>
      <span v-else-if="meta.goalPct !== null" class="block">
        <span class="block h-2.5 overflow-hidden rounded-full" :class="dark ? 'bg-white/10' : 'bg-[#f7dde4]'">
          <span class="block h-full rounded-full" :style="{ width: `${meta.goalPct}%`, background: 'linear-gradient(90deg,#e11d48,#8b5cf6)' }" />
        </span>
        <span class="mt-2 block font-mono text-[11px]" :class="dark ? 'text-white/60' : 'text-slate-500'">{{ meta.goalPct }} % · {{ meta.goalLabel }}</span>
      </span>
      <span v-else class="block text-[13px]" :class="dark ? 'text-white/60' : 'text-slate-500'">
        {{ meta.participationLabel }} collectée{{ (item.responses_count ?? 0) > 1 ? 's' : '' }}
      </span>
      <span class="mt-3.5 block font-mono text-[10.5px]" :class="dark ? 'text-white/55' : 'text-slate-400'">Une participation par compte · résultats publics</span>
    </span>
  </NuxtLink>

  <div
    v-else-if="format === 'row'"
    class="u-hover grid grid-cols-[minmax(0,2.5fr)_1.05fr_1fr_0.8fr_0.8fr_46px] items-center gap-3.5 border-b border-slate-100 px-5 py-3.5 last:border-b-0 hover:bg-[#faf8ff]"
  >
    <div class="flex min-w-0 items-center gap-3">
      <span
        class="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg text-[12px]"
        :style="{ background: meta.kind.bg, color: meta.kind.fg }"
      >{{ meta.kind.icon }}</span>
      <span class="min-w-0">
        <ContentFeaturedBadge v-if="pinned" compact class="mb-1" />
        <NuxtLink :to="isManage && manage ? manage.studioPath : to" class="u-card-title block truncate text-sm font-bold text-slate-950 hover:text-primary">{{ item.title }}</NuxtLink>
        <span class="mt-0.5 block truncate font-mono text-[10px] text-slate-400">{{ leadLine }}</span>
      </span>
    </div>
    <div class="truncate font-mono text-[10px] font-semibold tracking-[0.06em]" :style="{ color: meta.kind.fg }">
      {{ meta.kind.label }}
    </div>
    <div class="min-w-0 truncate text-[12.5px] font-semibold text-slate-600">{{ isManage && manage ? manage.ownerLabel : item.publisher.name }}</div>
    <div class="text-right font-mono text-[12.5px] font-semibold text-slate-950">{{ meta.participationLabel }}</div>
    <div class="text-right font-mono text-[11.5px]" :style="{ color: meta.timeFg }">{{ meta.timeLabel }}</div>
    <div class="flex justify-end">
      <ContentCardFavButton v-if="!isManage" compact :active="favorited" @toggle="emit('favorite')" />
      <span
        v-else-if="manage"
        class="rounded-full px-2 py-0.5 text-[9.5px] font-bold"
        :style="{ background: manage.statusBg, color: manage.statusColor }"
      >{{ manage.statusLabel }}</span>
    </div>
  </div>

  <article
    v-else
    class="u-card flex flex-col rounded-[18px] border-[1.5px] border-slate-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(20,20,30,0.06)] hover:-translate-y-0.5"
    :style="{ borderTop: `4px solid ${meta.kind.accent}` }"
  >
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <ContentFeaturedBadge v-if="pinned" />
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
      <ContentCardFavButton v-if="!isManage" :active="favorited" @toggle="emit('favorite')" />
      <span
        v-else-if="manage"
        class="rounded-full px-2.5 py-1 text-[10.5px] font-bold"
        :style="{ background: manage.statusBg, color: manage.statusColor }"
      >{{ manage.statusLabel }}</span>
    </div>

    <div v-if="item.category" class="mb-2 font-mono text-[9.5px] font-semibold tracking-[0.07em]" :style="{ color: theme.fg }">
      {{ item.category.toUpperCase() }}
    </div>
    <CatalogSubBrandTag :categories="item.categories" :sub-brand="item.sub_brand" content-type="survey" />
    <ContentCardDossierTag :dossier="item.dossier" />
    <NuxtLink
      :to="isManage && manage ? manage.studioPath : to"
      class="u-card-title block text-[17px] font-extrabold leading-tight tracking-[-0.015em] text-pretty text-slate-950 hover:text-primary"
    >
      {{ item.title }}
    </NuxtLink>

    <template v-if="!isManage">
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
            <div v-for="r in previewPreview.rows.slice(0, 3)" :key="r.label" class="grid grid-cols-[92px_1fr_36px] items-center gap-2">
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
    </template>

    <slot name="cta" />

    <div class="flex-1" />
    <ContentCardActions v-if="isManage && manage" :manage="manage" />
    <ContentCardOwner v-else :publisher="item.publisher" :meta="`Mis à jour ${formatRelativePublished(item.updated_at)}`" :to="to" />
  </article>
</template>
